"""Shared readiness vocabulary for doctor and smoke-test output."""

from enum import Enum


class Readiness(str, Enum):
    READY = "READY"
    READY_FOR_MOCK = "READY_FOR_MOCK"
    READY_FOR_REAL_FLOW = "READY_FOR_REAL_FLOW"
    BLOCKED = "BLOCKED"
    OPTIONAL = "OPTIONAL"
