import os
from crewai import Agent, Task, Crew
from crewai_tools import DirectoryReadTool, FileReadTool, FileWriterTool

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..")

dir_tool = DirectoryReadTool(directory=PROJECT_DIR)
file_read_tool = FileReadTool()
file_write_tool = FileWriterTool()

coder_agent = Agent(
    role='Senior Next.js & Prisma Developer',
    goal='Debug, write endpoints, update database schemas, and optimize the Latimore Hub codebase.',
    backstory=(
        "You are an expert full-stack developer specializing in React, Next.js App Router, TypeScript, "
        "Prisma, and PostgreSQL. You possess deep knowledge of secure API endpoint design and webhooks."
    ),
    tools=[dir_tool, file_read_tool, file_write_tool],
    verbose=True
)

debug_task = Task(
    description=(
        "Analyze the existing `app/api/fillout/route.ts` file (which re-exports from "
        "`app/api/webhooks/fillout/route.ts`). Ensure HMAC protection is correctly validating "
        "the incoming signature according to security best practices."
    ),
    expected_output="A code review summary and applied security enhancements if necessary.",
    agent=coder_agent
)

crew = Crew(
    agents=[coder_agent],
    tasks=[debug_task],
    verbose=True
)

if __name__ == "__main__":
    result = crew.kickoff()
    print(result)
