import copy
import json
import pathlib
import tempfile
import unittest

import consumer_contract_guard as guard


def operation():
    return {
        "operationId": "getItem",
        "parameters": [{"name": "id", "in": "path", "required": True}],
        "responses": {"200": {"description": "ok", "content": {"application/json": {}}}},
    }


def contract():
    inventory = {"schemaVersion": 1, "callSites": [{
        "file": "frontend/src/items.ts", "line": 2, "method": "GET", "path": "/api/items/{itemId}",
        "requestBody": False, "responseMode": "json",
    }]}
    usage = {"operations": [{
        "operationId": "getItem", "method": "GET", "path": "/api/items/{itemId}",
        "responseModes": ["json"], "successStatuses": ["200"],
    }]}
    spec = {"paths": {"/api/items/{id}": {"get": operation()}}}
    return inventory, usage, spec


class ConsumerContractGuardTest(unittest.TestCase):
    def test_inventory_is_byte_identical(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "items.ts").write_text(
                "import { api } from './http';\napi<Item>(`/items/${itemId}`);\n", encoding="utf-8"
            )
            first = json.dumps(guard.inventory(root), sort_keys=True)
            second = json.dumps(guard.inventory(root), sort_keys=True)
            self.assertEqual(first.encode(), second.encode())

    def test_additive_operation_is_compatible(self):
        inventory, usage, spec = contract()
        spec["paths"]["/api/health"] = {"get": {"operationId": "health", "responses": {"200": {}}}}
        self.assertEqual([], guard.validate(inventory, usage, spec))

    def test_unmapped_addition_and_removed_call_site_fail(self):
        inventory, usage, spec = contract()
        added = copy.deepcopy(inventory["callSites"][0])
        added.update(path="/api/other", line=3)
        inventory["callSites"].append(added)
        errors = guard.validate(inventory, usage, spec)
        self.assertIn("call_site_unmapped:GET /api/other", errors)
        inventory["callSites"] = []
        self.assertIn("usage_without_call_site:GET /api/items/{itemId}", guard.validate(inventory, usage, spec))

    def test_rename_method_and_response_removal_fail(self):
        inventory, usage, spec = contract()
        usage["operations"][0]["operationId"] = "renamed"
        self.assertTrue(any(error.startswith("operation_id_mismatch:") for error in guard.validate(inventory, usage, spec)))
        usage["operations"][0].update(operationId="getItem", method="POST")
        self.assertTrue(any(error.startswith("usage_without_call_site:") for error in guard.validate(inventory, usage, spec)))
        usage["operations"][0]["method"] = "GET"
        del spec["paths"]["/api/items/{id}"]["get"]["responses"]["200"]
        self.assertTrue(any(error.startswith("consumed_response_missing:") for error in guard.validate(inventory, usage, spec)))

    def test_required_path_parameter_and_body_fail(self):
        inventory, usage, spec = contract()
        inventory["callSites"][0]["path"] = "/api/items"
        usage["operations"][0]["path"] = "/api/items"
        spec["paths"] = {"/api/items": {"get": operation()}}
        self.assertTrue(any(error.startswith("required_path_parameter_missing:") for error in guard.validate(inventory, usage, spec)))
        inventory, usage, spec = contract()
        spec["paths"]["/api/items/{id}"]["get"]["requestBody"] = {"required": True}
        self.assertTrue(any(error.startswith("required_request_body_missing:") for error in guard.validate(inventory, usage, spec)))


if __name__ == "__main__":
    unittest.main()
