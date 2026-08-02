# Installing GLI-FLOW on Windows (via WSL2)

This guide is for a complete beginner on Windows who has never used Linux,
a terminal, or an EDA tool before. It walks through every step, in order,
with nothing assumed. If you're already comfortable with WSL2 and Linux,
you can skip ahead to [Part 3](#part-3-installing-gli-flow).

**Why WSL2?** GLI-FLOW's EDA tools (the software that actually does chip
synthesis, layout, and verification) only run on Linux. WSL2 ("Windows
Subsystem for Linux") lets you run a real Linux environment directly
inside Windows — no separate computer, no dual-boot, no virtual machine
software to manage yourself. Everything below happens on your normal
Windows PC.

**Before you start, check:**
- Windows 10 version 2004 or later, or Windows 11. (Check: Start menu →
  type `winver` → press Enter. It'll show your version.)
- About 15–20 GB of free disk space (Linux, the EDA tools, and a chip
  design library all take real space).
- An admin account on this PC, or someone who can enter an admin password
  when Windows asks.
- A stable internet connection (you'll be downloading a few GB total).

---

## Part 1: Install WSL2

1. Click the **Start menu**, type `powershell`, right-click **Windows
   PowerShell**, and choose **Run as administrator**. Click **Yes** if
   Windows asks for permission.

2. In the PowerShell window that opens, type this exactly and press
   Enter:

   ```powershell
   wsl --install
   ```

3. Windows will now download and set up WSL2 along with Ubuntu (a
   beginner-friendly version of Linux). This can take several minutes —
   you'll see text scrolling by. That's normal.

4. **If it asks you to restart your computer, do it.** Save any open work
   first. This step is unavoidable the first time WSL2 is turned on — it's
   a Windows requirement, not something specific to GLI-FLOW.

5. After restarting, Ubuntu should open automatically in its own window
   (a black terminal window). If it doesn't, click Start, type `Ubuntu`,
   and open it.

6. **The first time Ubuntu opens**, it will ask you to create a username
   and password *for Linux* — this is separate from your Windows login
   and can be anything you like (it doesn't need to match your Windows
   account). Note: when you type your password, nothing will appear on
   screen at all, not even dots — that's normal terminal behavior, just
   type it and press Enter.

   ```
   Enter new UNIX username: yourname
   New password:
   Retype new password:
   ```

7. You should now see a prompt that looks like `yourname@computername:~$`.
   **This is your Linux terminal.** Every command in the rest of this
   guide goes here, not in the Windows PowerShell window from step 1.

### Quick sanity check

Type this and press Enter:

```bash
lsb_release -a
```

You should see something mentioning `Ubuntu 22.04` or `Ubuntu 24.04`. If
you see a command-not-found error instead, something went wrong in the
steps above — see [Troubleshooting](#troubleshooting) below.

---

## Part 2: Update Ubuntu and install Python

Still inside the Ubuntu terminal window:

1. Update the package list (this refreshes Ubuntu's software catalog, it
   doesn't install anything yet):

   ```bash
   sudo apt update
   ```

   You'll be asked for the Linux password you created in step 6 above.
   Type it (again, nothing will show on screen) and press Enter.

2. Install Python and a few basic tools GLI-FLOW needs:

   ```bash
   sudo apt install -y python3 python3-venv python3-pip git
   ```

3. Confirm Python installed correctly:

   ```bash
   python3 --version
   ```

   You should see `Python 3.9` or higher. GLI-FLOW supports 3.9 through
   3.12.

---

## Part 3: Installing GLI-FLOW

### One-command path (recommended)

From the Ubuntu terminal, run:

```bash
curl -fsSL https://raw.githubusercontent.com/Jegadiswar-SM/gli-flow-1.0/main/gli-flow-asic/scripts/install.sh | bash
```

The installer creates the virtual environment, installs GLI-FLOW with
dashboard support, runs the mock smoke test, and tells you how to activate the
environment. In WSL2 it asks once whether to install the optional real EDA
prerequisites. After activation, try:

```bash
gli-flow quickstart
```

### Manual path (if you want to see each step)

1. Get the GLI-FLOW source code. If you have a specific location it was
   shared with you (e.g. a GitHub link), use that; otherwise:

   ```bash
   git clone https://github.com/Jegadiswar-SM/gli-flow-1.0.git
   cd gli-flow-1.0/gli-flow-asic
   ```

2. Create an isolated Python environment for GLI-FLOW (this keeps it from
   interfering with anything else on your system):

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

   Your prompt should now start with `(.venv)` — that means it worked.
   **You'll need to run that `source .venv/bin/activate` line again any
   time you close and reopen the terminal**, before running any `gli-flow`
   command.

3. Install GLI-FLOW itself:

   ```bash
   python -m pip install -e ".[dashboard]"
   ```

   This installs the command-line tool and everything needed for the
   visual dashboard. It can take a minute or two.

4. Confirm it installed correctly:

   ```bash
   gli-flow --help
   ```

   You should see a list of available commands. If you see
   `command not found` instead, close and reopen your terminal, re-run the
   `source .venv/bin/activate` line from step 2, and try again.

### Try it with a mock run (no EDA tools needed yet)

This runs a simulated design flow so you can see how GLI-FLOW works,
without needing to install the full (large) EDA toolchain yet:

```bash
gli-flow smoke-test --non-interactive
gli-flow run --example counter --mock --non-interactive
```

If both of those complete without errors, your basic install is working.
**Note:** anything with `--mock` is simulated practice output — it never
proves a real chip design works. Keep that in mind once you start
designing real things later.

---

## Part 4: Installing the real EDA tools (optional, do this when you're
ready to run real designs, not just mock ones)

This installs the actual chip-design software (synthesis, layout, and
verification tools) plus a manufacturing process library (a "PDK"). This
step downloads more data and takes longer than Parts 1–3 — budget
15–30+ minutes and several more GB of disk space, depending on your
connection.

1. **Preview first, without changing anything**, so you know exactly
   what's about to happen:

   ```bash
   gli-flow install --dry-run
   ```

   Read through the output. It'll tell you what will be installed and
   where.

2. When you're ready, run the real install:

   ```bash
   gli-flow install
   ```

   You'll likely be asked for your Linux password again at some point
   (installing system packages requires it).

3. Once it finishes, check that everything is actually working:

   ```bash
   gli-flow doctor
   ```

   This checks every tool GLI-FLOW needs and tells you clearly what's
   ready and what isn't. If something's missing, `doctor`'s own output
   will tell you specifically what and why — read that message rather
   than guessing.

4. Try a real (non-mock) run once `doctor` reports things are ready:

   ```bash
   gli-flow run --example counter
   ```

---

## Part 5: The dashboard (visual interface)

The command line works fully on its own, but there's also a visual
dashboard if you'd prefer that:

```bash
gli-flow dashboard
```

This starts a local web server and should open your default browser
automatically to it. If it doesn't open automatically, it will print a
web address (normally `http://127.0.0.1:5173`) — copy that into your browser
manually. The backend-only URL is `http://127.0.0.1:8000` when using
`gli-flow dashboard --backend-only`.

If a native desktop app version is available to you separately (rather
than opening in a browser), install and launch that instead, and point it
at this same WSL2 backend when it asks — see that app's own setup
instructions for the exact steps, since this can vary by version.

---

## Troubleshooting

**`wsl --install` says WSL is already installed, but I don't have
Ubuntu.**
Run `wsl --install -d Ubuntu` specifically (the `-d` flag picks a
distribution by name) instead of the bare command from Part 1.

**I get an error mentioning "virtualization" or "Hyper-V" during
`wsl --install`.**
Your PC's virtualization feature is turned off in the BIOS/UEFI
firmware (a settings screen outside Windows itself, accessed by pressing
a key like F2, F10, Del, or Esc right when your PC starts up — the exact
key varies by manufacturer). Look for a setting called **Intel VT-x**,
**AMD-V**, or **SVM Mode** and enable it, then restart and try again. If
you're not comfortable changing BIOS settings yourself, or this is a work
computer, ask whoever manages the PC for help — this isn't something
GLI-FLOW or Windows can fix from inside Windows itself.

**Nothing happens / I get a permissions or policy error when running
`wsl --install`.**
This usually means the PC is managed by an organization (school, employer)
that has restricted this feature through policy. You'll need your IT
department to either enable it for you or provide you with an
already-set-up Linux environment to connect to instead — ask them
specifically about "enabling WSL2" or "Windows Subsystem for Linux."

**I closed the terminal and now `gli-flow` command isn't found.**
You need to reactivate the Python environment each new terminal session.
Open Ubuntu, then run:
```bash
cd gli-flow-1.0/gli-flow-asic
source .venv/bin/activate
```

**`sudo apt update` or `gli-flow install` seems stuck.**
Some steps genuinely take a few minutes, especially on a slower
connection — give it a little time before assuming it's frozen. If it's
truly stuck (no disk activity, no new text at all for 10+ minutes), press
`Ctrl+C` to cancel and try running the same command again — GLI-FLOW's
install process is designed to be safely re-run without duplicating work
already done.

**I want to start over completely.**
You can remove just the Ubuntu Linux environment WSL2 created (this
deletes everything inside it, including your GLI-FLOW install, but doesn't
affect your actual Windows files) with:
```powershell
wsl --unregister Ubuntu
```
run from a Windows PowerShell window (not inside Ubuntu). Then start over
from Part 1, step 2.

---

## What's simulated vs. real — a note before you go further

Everything above gets you a working environment. Before you draw any
conclusions from a design run, keep this distinction in mind: `--mock`
runs are simulated practice output and never prove a real design is
correct, timing-clean, or manufacturable. Real readiness requires a real
(non-mock) run with actual tool evidence — synthesis, timing analysis,
DRC, LVS, and functional simulation all need to genuinely pass, with their
real output artifacts present, before treating any design as done.
