module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  env: {
    browser: true,
    es2022: true
  },
  extends: ["eslint:recommended", "prettier"],
  rules: {
    "no-eval": "error",
    "no-new-func": "error"
  }
}
