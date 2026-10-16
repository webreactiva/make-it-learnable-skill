import unittest
from pathlib import Path

import yaml

STRINGS = Path(__file__).resolve().parents[1] / "skills/make-it-learnable/references/strings.yaml"


class StringsTests(unittest.TestCase):
    def test_every_language_has_every_key(self):
        data = yaml.safe_load(STRINGS.read_text(encoding="utf-8"))
        langs = {k: set(v) for k, v in data.items() if k != "any"}
        reference = langs["en"]
        for lang, keys in langs.items():
            self.assertEqual(keys, reference, f"{lang}: missing {reference - keys}, extra {keys - reference}")


if __name__ == "__main__":
    unittest.main()
