import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILDER_PATH = ROOT / "reference-implementation/scripts/build_lesson.py"
SPEC = importlib.util.spec_from_file_location("build_lesson", BUILDER_PATH)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


def lesson(content=""):
    return f"""
<div class="ml-shell">
  <header class="ml-hero"><h1>Test lesson</h1></header>
  {content}
  <l-section id="explain" title="Explain" goal="Explain the result">
    <l-quiz mode="explain">
      <l-prompt>Why?</l-prompt>
      <l-reference><p>Because the contract says so.</p></l-reference>
    </l-quiz>
  </l-section>
  <l-checkpoint><l-can>Explain the contract</l-can></l-checkpoint>
  <l-finish><l-next><p>Out of scope: production data.</p></l-next></l-finish>
</div>
"""


def validate(source):
    root, parse_errors = builder.parse(source)
    return builder.check(root, parse_errors)


class ValidatorTests(unittest.TestCase):
    def test_valid_minimal_lesson(self):
        self.assertEqual(validate(lesson()), ([], []))

    def test_rejects_target_from_a_different_stage(self):
        stages = """
        <l-stage id="a"><div data-part="cache"></div></l-stage>
        <l-stage id="b"></l-stage>
        <l-scene stage="b" focus="cache"><p>Wrong stage.</p></l-scene>
        """
        errors, _ = validate(lesson(stages))
        self.assertTrue(any("resolved <l-stage id=\"b\">" in error for error in errors))

    def test_inherits_stage_from_stepper(self):
        content = """
        <l-stage id="diagram"><div data-part="cache"></div></l-stage>
        <l-stepper stage="diagram">
          <l-step focus="cache">First</l-step><l-step focus="cache">Second</l-step>
        </l-stepper>
        """
        self.assertEqual(validate(lesson(content)), ([], []))

    def test_rejects_malformed_nesting(self):
        source = lesson("<div><p>broken</div></p>")
        errors, _ = validate(source)
        self.assertTrue(any("still open" in error for error in errors))

    def test_rejects_quiz_without_explanation(self):
        quiz = """
        <l-section id="choice" title="Choose" goal="Choose">
          <l-quiz mode="choose" answer="a">
            <l-prompt>Pick one</l-prompt>
            <l-option value="a">Right</l-option><l-option value="b">Wrong</l-option>
            <l-miss for="b">A useful misconception.</l-miss>
          </l-quiz>
        </l-section>
        """
        errors, _ = validate(lesson(quiz))
        self.assertTrue(any("no explanatory feedback" in error for error in errors))

    def test_rejects_wrong_option_without_diagnostic(self):
        quiz = """
        <l-section id="choice" title="Choose" goal="Choose">
          <l-quiz mode="choose" answer="a">
            <l-prompt>Pick one</l-prompt>
            <l-option value="a">Right</l-option><l-option value="b">Wrong</l-option>
            <l-why><p>The explanation.</p></l-why>
          </l-quiz>
        </l-section>
        """
        errors, _ = validate(lesson(quiz))
        self.assertTrue(any("wrong option 'b'" in error for error in errors))

    def test_rejects_unsafe_whatif_expression(self):
        content = """
        <l-whatif><l-var name="x"></l-var>
          <l-out name="bad" expr="globalThis.fetch('https://example.com')"></l-out>
        </l-whatif>
        """
        errors, _ = validate(lesson(content))
        self.assertTrue(any("safe arithmetic expression" in error or "allowed Math" in error for error in errors))

    def test_rejects_executable_body_markup(self):
        errors, _ = validate(lesson('<script>alert("surprise")</script><p onclick="alert(1)">Click</p>'))
        self.assertTrue(any("<script> is not allowed" in error for error in errors))
        self.assertTrue(any("event handlers are not allowed" in error for error in errors))

    def test_rejects_external_embedded_asset(self):
        errors, _ = validate(lesson('<img src="https://example.com/tracker.png" alt="">'))
        self.assertTrue(any("not a safe self-contained URL" in error for error in errors))


class BuildTests(unittest.TestCase):
    def test_build_adds_csp_and_source_provenance(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            body = Path(temp_dir) / "body.html"
            output = Path(temp_dir) / "lesson.html"
            body.write_text(lesson(), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(BUILDER_PATH), str(body), "-o", str(output),
                 "--title", "Test", "--desc", "A test lesson", "--lang", "en",
                 "--source", "Primary source|https://example.com/source"],
                text=True, capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            built = output.read_text(encoding="utf-8")
            self.assertIn("Content-Security-Policy", built)
            self.assertIn("connect-src 'none'", built)
            self.assertIn('href="https://example.com/source"', built)
            self.assertIn("Primary source", built)

    def test_build_requires_source(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            body = Path(temp_dir) / "body.html"
            body.write_text(lesson(), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(BUILDER_PATH), str(body),
                 "--title", "Test", "--desc", "A test lesson"],
                text=True, capture_output=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("at least one --source", result.stderr)

    def test_build_rejects_javascript_source_url(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            body = Path(temp_dir) / "body.html"
            body.write_text(lesson(), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(BUILDER_PATH), str(body),
                 "--title", "Test", "--desc", "A test lesson",
                 "--source", "Bad|javascript:alert(1)"],
                text=True, capture_output=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("absolute http(s)", result.stderr)


if __name__ == "__main__":
    unittest.main()
