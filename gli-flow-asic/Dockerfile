# ==================================================
# GLI-FLOW Stable Container (FIXED VERSION)
# ==================================================

FROM ubuntu:22.04

LABEL maintainer="Green Lantern Industries <team@gatelevel.io>"
LABEL org.opencontainers.image.title="GLI-FLOW"
LABEL org.opencontainers.image.description="Stable RTL-to-GDS flow for SKY130"
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL org.opencontainers.image.version="v1.0.0-mvp"

ARG DEBIAN_FRONTEND=noninteractive

ENV PDK_ROOT=/pdk
ENV VOLARE_HOME=/pdk
ENV PDK=sky130A
ENV OPENRAM_HOME=/opt/OpenRAM
ENV PYTHONPATH="${OPENRAM_HOME}:${PYTHONPATH}"
ENV PATH="/usr/local/bin:${PATH}"

# --------------------------------------------------
# System dependencies (fixed)
# --------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    ca-certificates \
    build-essential \
    cmake \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    tcl \
    tcl-dev \
    tk-dev \
    libffi-dev \
    libssl-dev \
    libgomp1 \
    libtcl8.6 \
    yosys \
    klayout \
    netgen-lvs \
    magic \
 && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# Install OpenROAD (exact URL from confirmed build)
# --------------------------------------------------
RUN wget -q \
    https://github.com/Precision-Innovations/OpenROAD/releases/download/2024-12-14/openroad_2.0-17598-ga008522d8_amd64-ubuntu-22.04.deb \
    -O /tmp/openroad.deb \
 && apt-get update \
 && apt-get install -y --no-install-recommends /tmp/openroad.deb \
 && rm /tmp/openroad.deb \
 && rm -rf /var/lib/apt/lists/*

# Verify
RUN openroad -version && yosys -V

# --------------------------------------------------
# Python tools
# --------------------------------------------------
RUN pip3 install --no-cache-dir \
    click \
    rich \
    pyyaml \
    jinja2 \
    tabulate \
    librelane \
    volare

# --------------------------------------------------
# SKY130 (pinned)
# --------------------------------------------------
RUN mkdir -p /pdk \
 && volare enable --pdk sky130 latest 2>/dev/null \
 || volare enable --pdk sky130

# --------------------------------------------------
# OpenRAM (pinned to specific commit)
# --------------------------------------------------
RUN git clone https://github.com/VLSIDA/OpenRAM.git /opt/OpenRAM \
 && cd /opt/OpenRAM \
 && git checkout 5f4f5a9b3e468c102d01b7cf6337be06ec6e9c9a \
 && rm -rf .git

# --------------------------------------------------
# Create non-root user
# --------------------------------------------------
RUN groupadd -r gliflow && useradd -r -g gliflow -m -d /home/gliflow gliflow

# --------------------------------------------------
# GLI-FLOW
# --------------------------------------------------
WORKDIR /gli-flow
COPY setup.py /gli-flow/setup.py
COPY gli_flow/ /gli-flow/gli_flow/
RUN pip3 install --no-cache-dir -e . --no-deps

# Copy remaining source
COPY . /gli-flow
RUN pip3 install --no-cache-dir -e .

# --------------------------------------------------
# Workspace
# --------------------------------------------------
RUN mkdir -p /workspace /workspace/runs /workspace/reports \
 && chown -R gliflow:gliflow /workspace /gli-flow

USER gliflow
WORKDIR /workspace

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD gli-flow --help || exit 1

ENTRYPOINT ["gli-flow"]
CMD ["--help"]
