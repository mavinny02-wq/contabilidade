import copy
import datetime as dt
import hashlib
import json
import pathlib
import tempfile
import unittest

import openapi_guard as guard


def fixture():
    return {
        "openapi": "3.0.1",
        "info": {"title": "fixture", "version": "1"},
        "security": [{"bearer": []}],
        "paths": {
            "/items/{id}": {
                "get": {
                    "operationId": "getItem",
                    "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}],
                    "responses": {"200": {"description": "ok"}},
                }
            }
        },
        "components": {
            "schemas": {
                "Item": {
                    "type": "object",
                    "required": ["id"],
                    "properties": {"id": {"type": "string"}, "state": {"type": "string", "enum": ["A", "B"]}},
                }
            }
        },
    }


class OpenApiGuardTest(unittest.TestCase):
    def test_normalized_snapshot_is_byte_identical(self):
        document = fixture()
        document["servers"] = [{"url": "http://volatile"}]
        with tempfile.TemporaryDirectory() as directory:
            first, second = pathlib.Path(directory, "a.json"), pathlib.Path(directory, "b.json")
            guard.write_normalized(document, str(first))
            guard.write_normalized(document, str(second))
            self.assertEqual(first.read_bytes(), second.read_bytes())
            self.assertEqual(hashlib.sha256(first.read_bytes()).digest(), hashlib.sha256(second.read_bytes()).digest())

    def test_additive_change_is_compatible(self):
        old, new = fixture(), fixture()
        new["paths"]["/health"] = {"get": {"operationId": "health", "responses": {"200": {"description": "ok"}}}}
        new["components"]["schemas"]["Item"]["properties"]["label"] = {"type": "string"}
        self.assertEqual([], guard.breaking_changes(old, new))

    def test_removed_path_and_method_are_breaking(self):
        old, new = fixture(), fixture()
        new["paths"] = {}
        self.assertIn("path_removed:/items/{id}", guard.breaking_changes(old, new))
        new = fixture()
        new["paths"]["/items/{id}"] = {}
        self.assertIn("method_removed:GET /items/{id}", guard.breaking_changes(old, new))

    def test_required_parameter_is_breaking(self):
        old, new = fixture(), fixture()
        new["paths"]["/items/{id}"]["get"]["parameters"].append(
            {"name": "tenant", "in": "header", "required": True, "schema": {"type": "string"}}
        )
        self.assertTrue(any(change.startswith("required_parameter_added:") for change in guard.breaking_changes(old, new)))

    def test_property_removal_and_enum_narrowing_are_breaking(self):
        old, new = fixture(), fixture()
        del new["components"]["schemas"]["Item"]["properties"]["id"]
        new["components"]["schemas"]["Item"]["properties"]["state"]["enum"] = ["A"]
        changes = guard.breaking_changes(old, new)
        self.assertIn("property_removed:Item.id", changes)
        self.assertIn("enum_narrowed:Item.state", changes)

    def test_frontend_operation_must_exist(self):
        with tempfile.TemporaryDirectory() as directory:
            usage = pathlib.Path(directory, "usage.json")
            usage.write_text(json.dumps({"operations": [{"operationId": "missing"}]}))
            self.assertEqual(["frontend_operation_missing:missing"], guard.validate_usage(fixture(), str(usage)))

    def test_valid_exception_waives_exact_change_and_expired_one_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            exceptions = pathlib.Path(directory, "exceptions.json")
            base = {"change": "path_removed:/old", "owner": "api-owner", "reason": "transition", "transitionVersion": "2", "expiresOn": "2030-01-01"}
            exceptions.write_text(json.dumps({"exceptions": [base]}))
            remaining, errors = guard.apply_exceptions([base["change"]], str(exceptions), dt.date(2029, 1, 1))
            self.assertEqual(([], []), (remaining, errors))
            expired = copy.deepcopy(base)
            expired["expiresOn"] = "2028-01-01"
            exceptions.write_text(json.dumps({"exceptions": [expired]}))
            remaining, errors = guard.apply_exceptions([base["change"]], str(exceptions), dt.date(2029, 1, 1))
            self.assertEqual([base["change"]], remaining)
            self.assertEqual([f"expired_exception:{base['change']}"], errors)

    def test_authorization_relaxation_and_operation_id_change_are_breaking(self):
        old, new = fixture(), fixture()
        new["security"] = []
        new["paths"]["/items/{id}"]["get"]["operationId"] = "renamed"
        changes = guard.breaking_changes(old, new)
        self.assertIn("authorization_relaxed:GET /items/{id}", changes)
        self.assertIn("operation_id_changed:GET /items/{id}", changes)


if __name__ == "__main__":
    unittest.main()
