import argparse

from agent.orchestrator import run_agent, run_locator_failure_demo


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Claude SDET assistant"
    )
    parser.add_argument(
        "task",
        nargs="?",
        help="Task for the agent to perform",
    )
    parser.add_argument(
        "--demo-locator-failure",
        action="store_true",
        help="Run a disposable locator-failure demo and ask Claude to diagnose it",
    )
    args = parser.parse_args()

    if args.demo_locator_failure:
        if args.task:
            parser.error("Do not provide a task with --demo-locator-failure.")
        run_locator_failure_demo()
        return

    task = args.task or input("What should the SDET agent do? ").strip()
    if not task:
        parser.error("Provide a task.")

    run_agent(task)


if __name__ == "__main__":
    main()