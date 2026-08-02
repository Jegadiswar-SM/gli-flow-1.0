from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from gli_flow.telemetry.settings import get_telemetry_settings, TelemetryMode

console = Console()

def run_telemetry_wizard():
    console.print()
    console.print(Panel(
        "[bold cyan]Welcome to GLI-FLOW Telemetry[/bold cyan]\n\n"
        "GLI-FLOW collects sanitized execution telemetry to improve:\n"
        "  • [bold]Failure Atlas[/bold] (community failure knowledge)\n"
        "  • [bold]Resolution Intelligence[/bold] (AI-driven fixes)\n"
        "  • [bold]Trust Scoring[/bold] (verifying tool results)\n"
        "  • [bold]Product Quality[/bold]\n\n"
        "[bold green]Privacy Guarantee:[/bold green]\n"
        "GLI-FLOW [underline]NEVER[/underline] uploads RTL, Verilog, SystemVerilog, VHDL, Netlists,\n"
        "DEF, LEF, GDS, Bitstreams, Liberty Files, or Constraint Contents.\n\n"
        "[bold]What is collected:[/bold] sanitized stage names, tool/version identifiers,\n"
        "timings/counts, failure signatures, resolution outcomes, and a one-way design fingerprint.\n"
        "[bold]Destination:[/bold] GLI-FLOW telemetry service. [bold]Retention:[/bold] up to 24 months.\n"
        "You can change or revoke this later with `gli-flow telemetry disable` or `gli-flow config`.",
        border_style="cyan",
    ))
    console.print()

    console.print("[bold]Choose your Telemetry Mode:[/bold]")
    console.print("  [bold white]1. Local Only[/bold white] [Recommended]")
    console.print("     Nothing ever leaves your machine.")
    console.print("  [bold green]2. Full Sanitized Telemetry[/bold green]")
    console.print("     Uploads runtime metrics, failure signatures, root causes,\n"
                  "     resolution outcomes, and design fingerprints.")
    console.print("  [bold yellow]3. Failure Atlas Only[/bold yellow]")
    console.print("     Uploads only failure fingerprints and root causes.")
    console.print()

    choice = Prompt.ask(
        "Select a mode",
        choices=["1", "2", "3"],
        default="1"
    )

    settings = get_telemetry_settings()
    
    if choice == "1":
        settings.mode = TelemetryMode.LOCAL
        console.print("Local Only mode enabled. No data will be uploaded.")
    elif choice == "2":
        settings.mode = TelemetryMode.FULL
        settings.consent_given = True
        console.print("[green]Full Telemetry enabled.[/green]")
    elif choice == "3":
        settings.mode = TelemetryMode.ATLAS
        settings.consent_given = True
        console.print("[yellow]Failure Atlas Only mode enabled.[/yellow]")

    if choice == "1":
        settings.consent_given = False
    settings.save()

    console.print("\n[bold green]✓ Settings saved.[/bold green] Change or revoke with [bold]gli-flow telemetry disable[/bold] or [bold]gli-flow config[/bold].\n")
