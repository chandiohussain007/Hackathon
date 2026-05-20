"""
KhidmatAI Terminal Demo Runner
Simulates the frontend lifecycle via CLI for testing and recording the hackathon demo.
Outputs rich trace logs to show the "WOW" factor of ADK explainability.
"""
import sys
import json
import asyncio
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.syntax import Syntax

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from src.orchestration.supervisor import KhidmatSupervisor
from src.config import get_settings

console = Console()
settings = get_settings()


async def run_scenario(scenario: dict, supervisor: KhidmatSupervisor):
    console.print(f"\n[bold blue]── Running Scenario: {scenario['label']} ──[/bold blue]")
    console.print(f"[bold]Input:[/] {scenario['raw_input']}")

    with console.status("[bold green]Agent Orchestrator thinking...[/bold green]") as status:
        state = await supervisor.run(
            raw_input=scenario.get("raw_input", ""),
            user_lat=scenario.get("user_lat", 0.0),
            user_lng=scenario.get("user_lng", 0.0),
            location_label=scenario.get("location_label", ""),
            dispute_mode=scenario.get("dispute_mode", False),
            dispute_description=scenario.get("dispute_description", ""),
        )

    # ── Display Agent Traces (The WOW Factor) ──
    console.print("\n[bold magenta]🔍 Agent Trace Timeline:[/bold magenta]")
    for step in state.get("trace_log", []):
        if step["status"] == "completed" or step["status"] == "fallback":
            color = "green" if step["status"] == "completed" else "yellow"
            dur = f"{step.get('duration_ms', 0):.0f}ms" if step.get('duration_ms') else ""
            console.print(f"[{color}]✓ {step['agent']}[/] [dim]({dur})[/dim] → {step.get('reasoning', '')}")

    # ── Display Outcome ──
    console.print("\n[bold cyan]📊 Final Outcome:[/bold cyan]")
    if state["pipeline_status"] == "completed":
        # Print Price Breakdown
        price = state.get("price_breakdown", {})
        console.print(Panel(
            price.get("breakdown_text", "N/A"),
            title="Dynamic Pricing Explanation",
            border_style="cyan"
        ))
        # Print Booking
        bk = state.get("booking", {})
        console.print(f"[bold green]🎉 BOOKING CONFIRMED:[/] {bk.get('booking_id')} — {bk.get('provider_name')} @ {bk.get('scheduled_start')}")

    elif state["pipeline_status"] == "dispute_resolved":
        disp = state.get("dispute_result", {})
        console.print(f"[bold red]⚖️ DISPUTE CLASSIFIED:[/] {disp.get('dispute_type')} (conf: {disp.get('confidence')})")
        console.print(f"[bold yellow]RESOLUTION:[/] {disp.get('resolution')}")

    elif state["pipeline_status"] == "no_providers":
        console.print(f"[bold red]❌ FALLBACK:[/] {state.get('fallback_message')}")

    console.print("=" * 60)


async def main():
    console.print(Panel.fit(f"[bold white]KhidmatAI Local Demo Runner (MOCK_MODE={settings.mock_mode})[/bold white]\n[dim]Demonstrating ADK explainable multi-agent orchestration.[/dim]", style="blue"))

    MOCK_DATA = Path(__file__).parent / "sample_requests.json"
    scenarios = json.loads(MOCK_DATA.read_text(encoding="utf-8"))

    supervisor = KhidmatSupervisor()

    for idx, scenario in enumerate(scenarios):
        await run_scenario(scenario, supervisor)
        if idx < len(scenarios) - 1:
            input("\nPress Enter to run next scenario...")


if __name__ == "__main__":
    asyncio.run(main())
