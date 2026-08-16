import { supabase } from "@/integrations/supabase/client";

const inputCss = [
  "display:block",
  "width:100%",
  "height:48px",
  "box-sizing:border-box",
  "border:1px solid #d7dedb",
  "border-radius:12px",
  "background:#fff",
  "color:#1f2926",
  "padding:0 12px",
  "font:16px system-ui,sans-serif",
  "line-height:24px",
  "outline:none",
  "-webkit-appearance:none",
  "appearance:none",
  "-webkit-user-select:text",
  "user-select:text",
  "touch-action:manipulation",
].join(";");

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, string> = {}) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "text") node.textContent = value;
    else if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  }
  return node;
}

export function mountMobileAuth() {
  document.documentElement.style.cssText = "background:#f8faf9;";
  document.body.style.cssText = "margin:0;background:#f8faf9;color:#1f2926;font-family:system-ui,sans-serif;";
  document.body.innerHTML = "";

  let mode: "signin" | "signup" = "signin";
  let busy = false;

  const main = el("main");
  main.style.cssText = "min-height:100vh;width:100%;box-sizing:border-box;padding:32px 24px;background:#f8faf9;color:#1f2926;";
  const container = el("div");
  container.style.cssText = "width:100%;max-width:448px;margin:0 auto;";

  const header = el("div");
  header.style.cssText = "margin-bottom:24px;text-align:center;";
  const logo = el("div", { text: "₹" });
  logo.style.cssText = "width:56px;height:56px;margin:0 auto 8px;display:grid;place-items:center;border-radius:20px;background:#15977f;color:#fff;font-size:20px;font-weight:700;";
  const title = el("h1", { text: "Paisa" });
  title.style.cssText = "margin:0;font-size:24px;font-weight:800;";
  const subtitle = el("p", { text: "Your accounts, spending, budgets and insights in one pocket-sized app." });
  subtitle.style.cssText = "margin:8px 0 0;font-size:14px;color:#65716d;";
  header.append(logo, title, subtitle);

  const form = el("form");
  form.setAttribute("autocomplete", "off");
  form.style.cssText = "padding:20px;border-radius:24px;background:#fff;border:1px solid #e1e7e4;";

  const tabs = el("div");
  tabs.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;margin-bottom:16px;border-radius:16px;background:#eef3f1;";
  const signInTab = el("button", { text: "Sign in" }) as HTMLButtonElement;
  const signUpTab = el("button", { text: "Create account" }) as HTMLButtonElement;
  for (const button of [signInTab, signUpTab]) {
    button.type = "button";
    button.style.cssText = "height:40px;border:0;border-radius:12px;background:transparent;color:#1f2926;font:600 14px system-ui,sans-serif;";
  }
  tabs.append(signInTab, signUpTab);

  const fields = el("div");
  const nameWrap = el("label");
  const nameLabel = el("span", { text: "Name" });
  nameLabel.style.cssText = "display:block;margin-bottom:6px;font-size:12px;font-weight:600;";
  const name = el("input") as HTMLInputElement;
  name.type = "text";
  name.name = "name";
  name.autocomplete = "off";
  name.style.cssText = inputCss;
  nameWrap.style.cssText = "display:block;margin-bottom:16px;";
  nameWrap.append(nameLabel, name);

  const emailWrap = el("label");
  const emailLabel = el("span", { text: "Email" });
  emailLabel.style.cssText = "display:block;margin-bottom:6px;font-size:12px;font-weight:600;";
  const email = el("input") as HTMLInputElement;
  email.type = "email";
  email.name = "email";
  email.autocomplete = "off";
  email.style.cssText = inputCss;
  emailWrap.style.cssText = "display:block;margin-bottom:16px;";
  emailWrap.append(emailLabel, email);

  const passwordWrap = el("label");
  const passwordLabel = el("span", { text: "Password" });
  passwordLabel.style.cssText = "display:block;margin-bottom:6px;font-size:12px;font-weight:600;";
  const password = el("input") as HTMLInputElement;
  password.type = "password";
  password.name = "password";
  password.autocomplete = "off";
  password.style.cssText = inputCss;
  passwordWrap.style.cssText = "display:block;margin-bottom:16px;";
  passwordWrap.append(passwordLabel, password);

  const submit = el("button", { text: "Sign in" }) as HTMLButtonElement;
  submit.type = "submit";
  submit.style.cssText = "width:100%;height:48px;border:0;border-radius:12px;background:#15977f;color:#fff;font:600 16px system-ui,sans-serif;";

  fields.append(emailWrap, passwordWrap);
  form.append(tabs, fields, submit);
  container.append(header, form);
  main.append(container);
  document.body.append(main);

  const updateMode = (next: "signin" | "signup") => {
    mode = next;
    signInTab.style.background = mode === "signin" ? "#fff" : "transparent";
    signUpTab.style.background = mode === "signup" ? "#fff" : "transparent";
    submit.textContent = mode === "signin" ? "Sign in" : "Create account";
    if (mode === "signup") {
      if (!nameWrap.parentElement) fields.insertBefore(nameWrap, emailWrap);
    } else if (nameWrap.parentElement) {
      nameWrap.remove();
    }
  };

  signInTab.addEventListener("click", () => updateMode("signin"));
  signUpTab.addEventListener("click", () => updateMode("signup"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const emailValue = email.value.trim();
    const passwordValue = password.value;
    const nameValue = name.value.trim();
    if (!emailValue || !passwordValue) return;

    busy = true;
    submit.disabled = true;
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: emailValue,
          password: passwordValue,
          options: { emailRedirectTo: window.location.origin, data: { name: nameValue } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailValue, password: passwordValue });
        if (error) throw error;
      }
      window.location.hash = "#/";
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      busy = false;
      submit.disabled = false;
    }
  });

  updateMode("signin");
}
