import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("alert_guard.py")
SPEC = importlib.util.spec_from_file_location("alert_guard", MODULE_PATH)
assert SPEC and SPEC.loader
alert_guard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(alert_guard)


class AlertGuardTest(unittest.TestCase):
    def test_repository_contract_is_valid(self):
        self.assertEqual([], alert_guard.validate())


if __name__ == "__main__":
    unittest.main()
