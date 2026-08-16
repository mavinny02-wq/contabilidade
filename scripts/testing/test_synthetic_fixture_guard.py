import copy
import json
import tempfile
import unittest
from pathlib import Path

import synthetic_fixture_guard as guard


class SyntheticFixtureGuardTest(unittest.TestCase):
    def setUp(self):
        self.entry = json.loads(guard.CATALOG.read_text(encoding="utf-8"))["fixtures"][0]
        self.document = guard.generated_document(self.entry)

    def validate(self, document=None, entry=None):
        guard.validate_document(document or self.document, entry or self.entry)

    def test_generator_is_byte_for_byte_deterministic(self):
        first = guard.canonical_bytes(guard.generated_document(self.entry))
        second = guard.canonical_bytes(guard.generated_document(self.entry))
        self.assertEqual(first, second)

    def test_canonical_catalog_is_valid(self):
        self.assertEqual({"fixtures": 1, "schemas": 1}, guard.validate())

    def test_changed_content_breaks_checksum(self):
        changed = copy.deepcopy(self.document)
        changed["content"]["status"] = "changed"
        with self.assertRaisesRegex(guard.FixtureError, "checksum"):
            self.validate(changed)

    def test_uncatalogued_fixture_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / self.entry["path"]).write_bytes(guard.canonical_bytes(self.document))
            (root / "extra.json").write_text("{}", encoding="utf-8")
            catalog = root / "catalog.json"
            catalog.write_text(json.dumps({"fixtures": [self.entry]}), encoding="utf-8")
            with self.assertRaisesRegex(guard.FixtureError, "authorized fixture paths"):
                guard.validate(catalog, root)

    def test_non_reserved_email_is_rejected_without_disclosure(self):
        changed = copy.deepcopy(self.document)
        forbidden = "person" + "@" + "business" + ".com.br"
        changed["content"]["contact_email"] = forbidden
        changed["metadata"]["checksum_sha256"] = guard.checksum(changed["content"])
        entry = {**self.entry, "checksum_sha256": changed["metadata"]["checksum_sha256"]}
        with self.assertRaises(guard.FixtureError) as raised:
            self.validate(changed, entry)
        self.assertIn("non-reserved-email-domain", str(raised.exception))
        self.assertNotIn(forbidden, str(raised.exception))

    def test_unmarked_tax_identifier_is_rejected(self):
        changed = copy.deepcopy(self.document)
        changed["content"]["tax_id"] = ".".join(("123", "456", "789")) + "-09"
        changed["metadata"]["checksum_sha256"] = guard.checksum(changed["content"])
        entry = {**self.entry, "checksum_sha256": changed["metadata"]["checksum_sha256"]}
        with self.assertRaisesRegex(guard.FixtureError, "not marked synthetic"):
            self.validate(changed, entry)

    def test_sensitive_value_is_reported_only_by_fingerprint(self):
        changed = copy.deepcopy(self.document)
        sensitive = "Bearer " + "SyntheticTokenValue123456789"
        changed["content"]["authorization"] = sensitive
        changed["metadata"]["checksum_sha256"] = guard.checksum(changed["content"])
        entry = {**self.entry, "checksum_sha256": changed["metadata"]["checksum_sha256"]}
        with self.assertRaises(guard.FixtureError) as raised:
            self.validate(changed, entry)
        self.assertIn("bearer-token", str(raised.exception))
        self.assertNotIn(sensitive, str(raised.exception))

    def test_missing_seed_and_metadata_are_rejected(self):
        changed = copy.deepcopy(self.document)
        del changed["metadata"]["seed"]
        with self.assertRaisesRegex(guard.FixtureError, "missing metadata fields: seed"):
            self.validate(changed)


if __name__ == "__main__":
    unittest.main()
