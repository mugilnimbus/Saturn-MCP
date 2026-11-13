"""Fixture: a noisy suite with a few distinct failures buried in many passing tests."""
import pytest


def compute_total(values):
    return sum(values) + 1  # off-by-one bug


def load_config(name):
    return {"retries": 3}[name]


def level3(payload):
    return payload["user"]["profile"]["email"].lower()


def level2(payload):
    return level3(payload)


def level1(payload):
    return level2(payload)


@pytest.mark.parametrize("i", range(250))
def test_item_processing(i):
    print(f"processing item {i:04d} checksum={i * 7919 % 10007:05d} " + "." * 50)
    assert i >= 0


def test_total_is_correct():
    assert compute_total([1, 2, 3]) == 6


def test_config_has_timeout():
    assert load_config("timeout") == 30


def test_nested_profile_lookup():
    level1({"user": {"profile": {}}})


def test_database_connection():
    raise TimeoutError("connection to db-7 timed out after 30s")


@pytest.mark.parametrize("n", range(40))
def test_batch_boundaries(n):
    assert n % 13 != 0, f"batch {n} crossed the 13-item boundary"
