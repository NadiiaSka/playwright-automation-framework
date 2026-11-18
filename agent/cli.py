import argparse

from agent.orchestrator_groq import run_agent


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Groq SDET assistant (free tier)"
    )
    parser.add_argument(
        "task",
        nargs="?",
        help="Task for the agent to perform",
    )
    args = parser.parse_args()

    task = args.task or input("What should the SDET agent do? ").strip()
    if not task:
        parser.error("Provide a task.")

    run_agent(task)


if __name__ == "__main__":
    main()