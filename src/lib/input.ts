// 네이티브 키보드 입력 + IME 조합 처리 (PRD §4.1, §6).
//
// 화면을 덮는 투명 input 대신 오프스크린 input 에 focus() 해서 키보드를 띄운다.
// 한글은 IME 조합이 끝난 시점(compositionend)에만 물체를 만들고,
// 조합 중(ㅎ → 하 → 한)에는 고스트 텍스트로만 보여준다.
//
// iOS Safari 와 안드로이드 크롬의 이벤트 순서가 다르다:
// - 조합 중 input 이벤트는 isComposing 으로 걸러서 중복 스폰을 막는다
// - compositionend 에서 e.data 를 스폰하고 value 를 비우므로,
//   그 뒤에 오는 input 이벤트는 빈 value 를 보고 아무것도 하지 않는다

export interface InputHooks {
  /** 확정된 글자 하나 (공백·개행 제외) */
  onChar: (char: string) => void;
  /** 조합 중 텍스트. 빈 문자열이면 조합 종료(고스트 숨김) */
  onComposing: (text: string) => void;
}

export function mountHiddenInput(container: HTMLElement, hooks: InputHooks): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.autocomplete = "off";
  input.autocapitalize = "off";
  input.spellcheck = false;
  input.setAttribute("autocorrect", "off");
  input.setAttribute("aria-label", "글자 입력");
  // 화면에는 안 보이되 focus 는 가능해야 한다 (display:none 이면 키보드가 안 뜬다).
  // 상단에 두어야 iOS 가 focus 시 화면을 스크롤하지 않는다.
  input.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:0;padding:0;" +
    "background:transparent;color:transparent;caret-color:transparent;pointer-events:none;";
  container.appendChild(input);

  let composing = false;

  function flushChars(text: string) {
    for (const char of text) {
      if (char.trim() === "") {
        continue; // 공백은 물체 없음 (폭발 임펄스는 이후 PR)
      }
      hooks.onChar(char);
    }
  }

  input.addEventListener("compositionstart", () => {
    composing = true;
  });

  input.addEventListener("compositionupdate", (e) => {
    hooks.onComposing(e.data ?? "");
  });

  input.addEventListener("compositionend", (e) => {
    composing = false;
    hooks.onComposing("");
    if (e.data) {
      flushChars(e.data);
    }
    input.value = "";
  });

  input.addEventListener("input", (e) => {
    if (composing || (e as InputEvent).isComposing) {
      return; // 조합 중 — compositionend 에서 처리한다
    }
    if (input.value) {
      flushChars(input.value);
      input.value = "";
    }
  });

  // 키보드가 닫혀도(blur) 조합 고스트가 남지 않게
  input.addEventListener("blur", () => {
    composing = false;
    hooks.onComposing("");
    input.value = "";
  });

  return input;
}
