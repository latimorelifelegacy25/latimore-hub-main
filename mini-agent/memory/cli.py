"""Human-only memory management: `python agent.py memory <command>`."""
import argparse
import json
import sys

from .redact import redact_text
from .store import Store, normalize_domain

COMMANDS = {"remember", "prefer", "list", "stats", "forget", "export"}
WRITE_COMMANDS = {"remember", "prefer", "forget"}


def _interactive() -> bool:
    """Writes need a real terminal on both ends. run_shell captures output, so a model-invoked
    CLI call is refused. (A mitigation only: the shell can still edit the DB file directly.)"""
    try:
        return sys.stdin.isatty() and sys.stdout.isatty()
    except (AttributeError, ValueError):
        return False


def build_parser():
    p = argparse.ArgumentParser(prog="agent.py memory", description="Manage the agent's local memory.")
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("remember", help="store a fact you want the agent to see as a note")
    r.add_argument("topic")
    r.add_argument("fact")
    pr = sub.add_parser("prefer", help="store a preference")
    pr.add_argument("key")
    pr.add_argument("value")
    sub.add_parser("list", help="show notes, preferences and recent sessions")
    sub.add_parser("stats", help="row counts and DB info")
    sub.add_parser("export", help="dump everything as JSON to stdout")
    f = sub.add_parser("forget", help="delete stored data")
    g = f.add_mutually_exclusive_group(required=True)
    g.add_argument("--all", action="store_true")
    g.add_argument("--session", type=int, metavar="ID")
    g.add_argument("--url-domain", metavar="DOMAIN")
    g.add_argument("--fact", type=int, metavar="ID")
    return p


def main(argv=None, out=None) -> int:
    out = out or sys.stdout
    args = build_parser().parse_args(argv)
    if args.cmd in WRITE_COMMANDS and not _interactive():
        print(f"Refusing to run 'memory {args.cmd}': write commands need an interactive terminal "
              "(stdin and stdout must be a TTY).", file=sys.stderr)
        return 2
    try:
        store = Store()
    except OSError as exc:
        print(f"Cannot open memory DB: {exc}", file=sys.stderr)
        return 2
    try:
        if args.cmd == "remember":
            kid = store.add_knowledge(args.topic, args.fact, source="user")
            print(f"Saved note #{kid} (secrets are auto-redacted).", file=out)
        elif args.cmd == "prefer":
            store.set_preference(args.key, args.value, source="user")
            print(f"Saved preference {redact_text(args.key, 100)}.", file=out)
        elif args.cmd == "list":
            print("Notes:", file=out)
            for k in store.list_knowledge():
                print(f"  #{k['id']} [{k['source']}] {k['topic']}: {k['fact']}", file=out)
            print("Preferences:", file=out)
            for p in store.list_preferences():
                print(f"  {p['key']} = {p['value']} [{p['source']}]", file=out)
            print("Recent sessions:", file=out)
            for s in store.recent_sessions(10):
                print(f"  #{s['id']} {s['started_at']} iterations={s['iterations']} "
                      f"goal={s['goal'][:80]!r} outcome={s['outcome'][:80]!r}", file=out)
        elif args.cmd == "stats":
            for key, value in store.stats().items():
                print(f"{key}: {value}", file=out)
        elif args.cmd == "export":
            print(json.dumps(store.export(), indent=2), file=out)
        elif args.cmd == "forget":
            if args.all:
                try:
                    confirmed = input("Delete ALL memory? [y/N] ").lower() == "y"
                except EOFError:
                    confirmed = False
                if not confirmed:
                    print("Cancelled.", file=out)
                    return 1
                result = store.forget_all()
            elif args.session is not None:
                result = store.forget_session(args.session)
            elif args.url_domain:
                try:
                    normalized = normalize_domain(args.url_domain)
                except ValueError as exc:
                    print(f"Error: {exc}", file=sys.stderr)
                    return 2
                print(f"Forgetting domain: {normalized} (and its subdomains)", file=out)
                result = store.forget_url_domain(normalized)
            else:
                result = store.forget_fact(args.fact)
            print("Deleted: " + ", ".join(f"{k}={v}" for k, v in result.items() if k != "domain"), file=out)
    finally:
        store.close()
    return 0
