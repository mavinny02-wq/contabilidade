import copy
import tempfile
import unittest
from pathlib import Path

from validate_required_ci import MANDATORY, WORKFLOW, load_yaml, validate


class RequiredCiContractTest(unittest.TestCase):
    def setUp(self):
        self.workflow = load_yaml(WORKFLOW)

    def validate_mutation(self, mutate):
        document = copy.deepcopy(self.workflow)
        mutate(document)
        with tempfile.NamedTemporaryFile("w", suffix=".yml") as stream:
            # JSON is a valid YAML document and avoids a test-only YAML emitter dependency.
            import json
            json.dump(document, stream)
            stream.flush()
            return validate(Path(stream.name))

    def test_canonical_workflow_is_valid_yaml_and_satisfies_contract(self):
        self.assertEqual([], validate())

    def test_rejects_changed_workflow_name(self):
        self.assertTrue(self.validate_mutation(lambda doc: doc.update(name="Renamed")))

    def test_rejects_each_missing_lane(self):
        for lane in MANDATORY:
            with self.subTest(lane=lane):
                self.assertTrue(self.validate_mutation(lambda doc, lane=lane: doc["jobs"].pop(lane)))

    def test_rejects_incomplete_needs(self):
        self.assertTrue(self.validate_mutation(lambda doc: doc["jobs"]["required-ci"].update(needs=["governance"])))

    def test_rejects_continue_on_error(self):
        self.assertTrue(self.validate_mutation(lambda doc: doc["jobs"]["frontend"].update({"continue-on-error": True})))
        self.assertTrue(self.validate_mutation(lambda doc: doc["jobs"]["frontend"]["steps"][0].update({"continue-on-error": True})))

    def test_rejects_missing_backend_testcontainers_proof(self):
        self.assertTrue(self.validate_mutation(lambda doc: doc["jobs"]["backend-postgresql"].update(steps=[])))

    def test_rejects_missing_worker_chromium_or_full_suite(self):
        self.assertTrue(self.validate_mutation(lambda doc: doc["jobs"]["worker"].update(steps=[])))

    def test_rejects_skippable_final_gate(self):
        self.assertTrue(self.validate_mutation(lambda doc: doc["jobs"]["required-ci"].update({"if": "success()"})))


if __name__ == "__main__":
    unittest.main()
