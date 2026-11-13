"""Fixture: thousands of routine log lines with one real problem in the middle."""


def test_pipeline_run():
    for i in range(2500):
        if i == 1733:
            print(f"2026-10-09 10:{i % 60:02d}:11 WARN scheduler: worker-9 heartbeat missed, job 8841 appears stuck in state RETRYING")
        else:
            print(f"2026-10-09 10:{i % 60:02d}:{i % 50:02d} INFO scheduler: tick {i} dispatched {i % 7} jobs to worker-{i % 8}")
