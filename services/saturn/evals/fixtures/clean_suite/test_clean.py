import pytest


@pytest.mark.parametrize("i", range(300))
def test_ok(i):
    assert i == i
