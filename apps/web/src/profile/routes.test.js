import assert from "node:assert/strict";
import test from "node:test";
import { parseProfilePath, profilePath, profileRedirect } from "./routes.js";

test("canonical Profile paths parse to their section", () => {
  assert.equal(parseProfilePath("/profile/account"), "account");
  assert.equal(parseProfilePath("/profile/preparation"), "preparation");
  assert.equal(parseProfilePath("/profile/preparation/edit"), "edit");
  assert.equal(parseProfilePath("/profile/preparation/playbook"), "playbook");
  assert.equal(parseProfilePath("/profile/preferences/"), "preferences");
});

test("unknown Profile subpaths are notFound", () => {
  assert.equal(parseProfilePath("/profile/nope"), "notFound");
  assert.equal(parseProfilePath("/profile/preparation/x"), "notFound");
});

test("bare Profile and legacy aliases redirect to preparation", () => {
  for (const path of ["/profile", "/profile/", "/profile/cv", "/profile/connections"]) {
    assert.equal(profileRedirect(path), "/profile/preparation", path);
  }
  assert.equal(profileRedirect("/profile/account"), null);
  assert.equal(profileRedirect("/profile/nope"), null);
});

test("profilePath round-trips every section", () => {
  for (const s of ["account", "preparation", "edit", "playbook", "preferences"]) {
    assert.equal(parseProfilePath(profilePath(s)), s);
  }
});
