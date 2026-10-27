import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const translate = (key) => window.KazeI18n?.t(key) || key;
  const modal = $("#authModal");
  const form = $("#authForm");
  const status = $("#authStatus");
  const nameField = $("#authNameField");
  const confirmField = $("#authConfirmField");
  const passwordField = $("#authPasswordField");
  const googleButton = $("#googleSignInButton");
  const modeButton = $("#authModeToggle");
  const resetButton = $("#authResetButton");
  const signOutButton = $("#authSignOutButton");
  const securityTestButton = $("#authSecurityTestButton");
  const securityTestResult = $("#authSecurityTestResult");
  const accountDetails = $("#authAccountDetails");
  const accountForm = $("#authFormArea");
  let mode = "login";
  let auth = null;
  let currentUser = null;
  let appReady = false;
  let messageTimer = null;

  function tell(key, fallback) {
    if (status) status.textContent = translate(key) === key ? fallback : translate(key);
    status?.classList.remove("auth-error", "auth-success");
    if (key.startsWith("auth_error_")) status?.classList.add("auth-error");
    if (key.startsWith("auth_success_")) status?.classList.add("auth-success");
  }

  function setStatus(message, kind = "info") {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("auth-error", "auth-success");
    if (kind === "error") status.classList.add("auth-error");
    if (kind === "success") status.classList.add("auth-success");
  }

  function openModal() {
    modal?.classList.remove("hidden");
    document.body.classList.add("modal-open");
    if (!isFirebaseConfigured) {
      setStatus(translate("auth_config_missing"), "error");
    } else if (currentUser) {
      showSignedInState(currentUser);
    } else {
      showSignedOutState();
    }
    $("#closeAuth")?.focus();
  }

  function closeModal() {
    modal?.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function switchMode(nextMode) {
    mode = nextMode;
    const isRegister = mode === "register";
    if (nameField) nameField.hidden = !isRegister;
    if (confirmField) confirmField.hidden = !isRegister;
    if (passwordField) passwordField.hidden = mode === "reset";
    if (form) form.hidden = false;
    const nameInput = $("#authName");
    const passwordInput = $("#authPassword");
    const confirmInput = $("#authPasswordConfirm");
    if (nameInput) nameInput.required = isRegister;
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.required = mode !== "reset";
      passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
    }
    if (confirmInput) {
      confirmInput.value = "";
      confirmInput.required = isRegister;
    }
    $("#authTitle").textContent = translate(mode === "register" ? "auth_register_title" : mode === "reset" ? "auth_reset_title" : "auth_login_title");
    $("#authSubmitButton").textContent = translate(mode === "register" ? "auth_create_account" : mode === "reset" ? "auth_send_reset" : "auth_login");
    modeButton.textContent = translate(mode === "register" ? "auth_have_account" : mode === "reset" ? "auth_back_login" : "auth_need_account");
    resetButton.hidden = mode !== "login";
    googleButton.hidden = mode === "reset";
    confirmInput?.setCustomValidity("");
    tell("auth_signed_out_hint", "");
  }

  function showSignedOutState() {
    accountForm.hidden = false;
    accountDetails.hidden = true;
    form.hidden = false;
    googleButton.hidden = false;
    modeButton.hidden = false;
    signOutButton.hidden = true;
    resetButton.hidden = false;
    switchMode("login");
    if (!isFirebaseConfigured) {
      setStatus(translate("auth_config_missing"), "error");
      form.querySelectorAll("input,button").forEach((element) => { element.disabled = true; });
      googleButton.disabled = true;
      modeButton.disabled = true;
      resetButton.disabled = true;
    } else {
      form.querySelectorAll("input,button").forEach((element) => { element.disabled = false; });
      googleButton.disabled = false;
      modeButton.disabled = false;
      resetButton.disabled = false;
      tell("auth_signed_out_hint", "");
    }
  }

  function showSignedInState(user) {
    accountForm.hidden = true;
    accountDetails.hidden = false;
    signOutButton.hidden = false;
    securityTestResult.hidden = true;
    securityTestResult.classList.add("hidden");
    $("#authTitle").textContent = translate("auth_account_title");
    $("#authUserEmail").textContent = user.email || translate("auth_email_missing");
    $("#authUserName").textContent = user.displayName || user.email?.split("@")[0] || translate("auth_customer");
    tell(user.emailVerified ? "auth_signed_in_verified" : "auth_signed_in_unverified", "");
    loadOwnProfile(user).catch(() => {
      $("#authProfileState").textContent = translate("auth_profile_backend_pending");
    });
  }

  async function loadOwnProfile(user) {
    const token = await user.getIdToken();
    const response = await fetch("/api/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Profile API returned ${response.status}`);
    const result = await response.json();
    const profile = result.profile;
    if (profile) {
      $("#authUserName").textContent = profile.displayName || user.displayName || user.email || "";
      $("#authProfileState").textContent = translate("auth_profile_connected");
    } else {
      $("#authProfileState").textContent = translate("auth_profile_not_created");
    }
  }

  async function saveOwnProfile(user, displayName) {
    const token = await user.getIdToken();
    const response = await fetch("/api/me", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ displayName: displayName || user.displayName || user.email?.split("@")[0] || "KAZE customer" }),
      cache: "no-store"
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Profile API returned ${response.status}`);
    }
    return response.json();
  }

  function friendlyError(error) {
    const code = error?.code || "";
    const isEnglish = window.KazeI18n?.getLanguage() === "en";
    const messages = {
      "auth/invalid-email": ["البريد الإلكتروني مش صحيح.", "The email address is invalid."],
      "auth/missing-password": ["اكتب كلمة المرور.", "Enter your password."],
      "auth/invalid-credential": ["البريد الإلكتروني أو كلمة المرور غير صحيحة.", "The email or password is incorrect."],
      "auth/email-already-in-use": ["البريد ده مسجل بالفعل. جرّب تسجيل الدخول.", "This email is already registered. Try signing in."],
      "auth/weak-password": ["كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.", "Password is too weak. Use at least 6 characters."],
      "auth/popup-closed-by-user": ["تم إغلاق نافذة Google قبل اكتمال الدخول.", "The Google sign-in window was closed before completion."],
      "auth/operation-not-allowed": ["طريقة الدخول دي لسه مش مفعلة في Firebase.", "This sign-in method is not enabled in Firebase yet."],
      "auth/too-many-requests": ["محاولات كتير في وقت قصير. حاول لاحقًا.", "Too many attempts. Please try again later."],
      "auth/network-request-failed": ["في مشكلة اتصال بالإنترنت. جرّب تاني.", "Network error. Check your connection and try again."],
      "auth/unauthorized-domain": ["الدومين الحالي مش مضاف للدومينات المسموح بيها في Firebase.", "This domain is not authorized in Firebase."],
      "auth/popup-blocked": ["المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة للموقع وجرب تاني.", "The browser blocked the Google popup. Allow popups and try again."],
      "auth/account-exists-with-different-credential": ["البريد مسجل بطريقة دخول مختلفة.", "This email is registered with a different sign-in method."]
    };
    const pair = messages[code];
    return pair ? pair[isEnglish ? 1 : 0] : (isEnglish ? "Something went wrong. Please check Firebase settings and try again." : "حصلت مشكلة. راجع إعدادات Firebase وجرب تاني.");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!appReady || !auth) {
      tell("auth_config_missing", "");
      return;
    }
    const email = $("#authEmail").value.trim();
    const password = $("#authPassword").value;
    const displayName = $("#authName").value.trim();
    const confirmPassword = $("#authPasswordConfirm").value;
    const submitButton = $("#authSubmitButton");
    submitButton.disabled = true;
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setStatus(translate("auth_reset_sent"), "success");
        switchMode("login");
        return;
      }
      if (mode === "register") {
        if (displayName.length < 2) throw new Error(window.KazeI18n?.getLanguage() === "en" ? "Enter a name with at least 2 characters." : "اكتب اسم من حرفين على الأقل.");
        if (password !== confirmPassword) throw new Error(translate("auth_password_mismatch"));
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        try { await sendEmailVerification(credential.user); } catch (_) { /* Sign-up remains valid if email verification cannot be sent. */ }
        currentUser = credential.user;
        try { await saveOwnProfile(credential.user, displayName); } catch (_) { /* The API/DB setup may be completed just after Firebase. */ }
        showSignedInState(credential.user);
        setStatus(translate("auth_account_created"), "success");
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = credential.user;
        try { await saveOwnProfile(credential.user, credential.user.displayName); } catch (_) { /* Login remains valid while backend setup is completed. */ }
        showSignedInState(credential.user);
        setStatus(translate("auth_login_success"), "success");
      }
    } catch (error) {
      setStatus(error?.message && !error?.code ? error.message : friendlyError(error), "error");
    } finally {
      submitButton.disabled = false;
    }
  }

  async function handleGoogleSignIn() {
    if (!appReady || !auth) return tell("auth_config_missing", "");
    googleButton.disabled = true;
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      currentUser = credential.user;
      try { await saveOwnProfile(credential.user, credential.user.displayName); } catch (_) { /* Backend setup is independently testable. */ }
      showSignedInState(credential.user);
      setStatus(translate("auth_login_success"), "success");
    } catch (error) {
      setStatus(friendlyError(error), "error");
    } finally {
      googleButton.disabled = false;
    }
  }

  async function runSecurityTest() {
    if (!currentUser) return;
    securityTestButton.disabled = true;
    securityTestResult.hidden = false;
    securityTestResult.classList.remove("hidden");
    securityTestResult.textContent = translate("auth_security_test_loading");
    try {
      const token = await currentUser.getIdToken(true);
      const [profileResponse, adminResponse] = await Promise.all([
        fetch("/api/me", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" }),
        fetch("/api/admin/check", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" })
      ]);
      const language = window.KazeI18n?.getLanguage() === "en" ? "en" : "ar";
      const profileExpected = profileResponse.status === 200;
      const adminExpected = adminResponse.status === 200 || adminResponse.status === 403;
      const statusWord = (response, expected) => `${response.status} — ${expected ? (language === "en" ? "expected" : "متوقع") : (language === "en" ? "check configuration" : "راجع الإعدادات")}`;
      securityTestResult.textContent = [
        `${translate("auth_security_test_api")}: ${statusWord(profileResponse, profileExpected)}`,
        `${translate("auth_security_test_admin")}: ${statusWord(adminResponse, adminExpected)}`,
        language === "en" ? "200 on admin check = configured admin; 403 = ordinary signed-in customer. 503 means server setup is incomplete." : "200 في اختبار المدير = حساب المدير المضبوط؛ 403 = عميل عادي مسجل الدخول. 503 معناها إن إعداد الخادم لسه ناقص."
      ].join("\n");
    } catch (_) {
      securityTestResult.textContent = window.KazeI18n?.getLanguage() === "en" ? "Could not contact the API. Check deployment and network." : "تعذر الاتصال بالـ API. راجع النشر والإنترنت.";
    } finally {
      securityTestButton.disabled = false;
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    try {
      await signOut(auth);
      currentUser = null;
      showSignedOutState();
      setStatus(translate("auth_signed_out_success"), "success");
    } catch (error) {
      setStatus(friendlyError(error), "error");
    }
  }

  function init() {
    $("#accountButton")?.addEventListener("click", openModal);
    $("#closeAuth")?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    form?.addEventListener("submit", handleSubmit);
    googleButton?.addEventListener("click", handleGoogleSignIn);
    modeButton?.addEventListener("click", () => switchMode(mode === "login" ? "register" : "login"));
    resetButton?.addEventListener("click", () => switchMode("reset"));
    signOutButton?.addEventListener("click", handleSignOut);
    securityTestButton?.addEventListener("click", runSecurityTest);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
    document.addEventListener("kaze:languagechange", () => {
      const buttonLabel = $("#accountButtonLabel");
      if (buttonLabel) buttonLabel.textContent = translate(currentUser ? "auth_account" : "auth_sign_in");
      if (!modal?.classList.contains("hidden")) {
        if (currentUser) showSignedInState(currentUser); else if (isFirebaseConfigured) switchMode(mode); else setStatus(translate("auth_config_missing"), "error");
      }
    });

    if (!isFirebaseConfigured) {
      showSignedOutState();
      return;
    }
    try {
      auth = getAuth(initializeApp(firebaseConfig));
      appReady = true;
      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user && modal && !modal.classList.contains("hidden")) showSignedInState(user);
        const buttonLabel = $("#accountButtonLabel");
        if (buttonLabel) buttonLabel.textContent = user ? translate("auth_account") : translate("auth_sign_in");
      });
    } catch (_) {
      setStatus(translate("auth_config_error"), "error");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
