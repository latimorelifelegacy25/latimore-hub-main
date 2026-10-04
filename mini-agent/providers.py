"""Pluggable model providers.

The agent loop talks to this interface, never to an SDK directly, so the
model can be swapped without touching agent.py / tools.py / bot.py.

To add a provider (e.g. Gemini, Anthropic):
  1. Subclass Provider and implement the four methods below.
  2. Register it in get_provider().
History is passed as a list of plain dicts in a provider-native shape;
each provider owns the conversion via assistant_msg / tool_msg / image_msg.
"""
import asyncio
import json
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: dict


@dataclass
class ModelMessage:
    content: str | None
    tool_calls: list = field(default_factory=list)  # list[ToolCall]


class Provider(ABC):
    name: str = "base"

    @abstractmethod
    async def complete(self, messages: list, tools: list) -> ModelMessage:
        """One model turn. `messages` are provider-native dicts."""

    @abstractmethod
    def assistant_msg(self, msg: ModelMessage) -> dict:
        """Encode the model's reply back into history format."""

    @abstractmethod
    def tool_msg(self, call_id: str, name: str, text: str) -> dict:
        """Encode a tool result into history format."""

    @abstractmethod
    def image_msg(self, image_b64: str, caption: str) -> dict:
        """A user message carrying an image (e.g. a screenshot)."""


class OpenAIProvider(Provider):
    name = "openai"

    def __init__(self):
        from openai import OpenAI

        self.client = OpenAI()  # reads OPENAI_API_KEY
        self.model = os.environ.get("MODEL", "gpt-4o")

    async def complete(self, messages: list, tools: list) -> ModelMessage:
        resp = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.model,
            messages=messages,
            tools=tools,
        )
        msg = resp.choices[0].message
        calls = [
            ToolCall(
                id=tc.id,
                name=tc.function.name,
                arguments=json.loads(tc.function.arguments or "{}"),
            )
            for tc in (msg.tool_calls or [])
        ]
        return ModelMessage(content=msg.content, tool_calls=calls)

    def assistant_msg(self, msg: ModelMessage) -> dict:
        d = {"role": "assistant", "content": msg.content or ""}
        if msg.tool_calls:
            d["tool_calls"] = [
                {
                    "id": c.id,
                    "type": "function",
                    "function": {
                        "name": c.name,
                        "arguments": json.dumps(c.arguments),
                    },
                }
                for c in msg.tool_calls
            ]
        return d

    def tool_msg(self, call_id: str, name: str, text: str) -> dict:
        return {
            "role": "tool",
            "tool_call_id": call_id,
            "name": name,
            "content": text,
        }

    def image_msg(self, image_b64: str, caption: str) -> dict:
        return {
            "role": "user",
            "content": [
                {"type": "text", "text": caption},
                {
                    "type": "image_url",
                    "image_url": {"url": "data:image/png;base64," + image_b64},
                },
            ],
        }


def get_provider() -> Provider:
    which = os.environ.get("PROVIDER", "openai").lower()
    if which == "openai":
        return OpenAIProvider()
    raise ValueError(
        f"Unknown provider {which!r}. Subclass Provider in providers.py "
        "and register it in get_provider()."
    )
