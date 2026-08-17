// 글자 입력 + IME 조합 처리 (PRD §4.1, §6).
//
// 보이지 않는 input 에 focus 를 주는 방식은 모바일 브라우저가 키보드를
// 안정적으로 띄우지 않아서, 화면에 보이는 input 박스를 focus 대상으로 쓴다.
// 한글은 IME 조합이 끝난 시점(compositionend)에만 물체를 만들고,
// 조합 중(ㅎ → 하 → 한)은 input 박스 안에서 그대로 보인다.
//
// iOS Safari 와 안드로이드 크롬의 이벤트 순서가 다르다:
// - 조합 중 input 이벤트는 isComposing 으로 걸러서 중복 스폰을 막는다
// - compositionend 에서 e.data 를 스폰하고 value 를 비우므로,
//   그 뒤에 오는 input 이벤트는 빈 value 를 보고 아무것도 하지 않는다

export interface InputHooks {
  /** 확정된 글자 하나 (공백·개행 제외) */
  onChar: (char: string) => void;
}

export function wireLetterInput(input: HTMLInputElement, hooks: InputHooks) {
  input.autocomplete = "off";
  input.autocapitalize = "off";
  input.spellcheck = false;
  input.setAttribute("autocorrect", "off");
  input.setAttribute("enterkeyhint", "done");

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

  input.addEventListener("compositionend", (e) => {
    composing = false;
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

  input.addEventListener("blur", () => {
    composing = false;
    input.value = "";
  });
}

/** 데스크톱(마우스 환경)에서는 별도 탭 없이 바로 타이핑되도록 input 을 붙잡아 둔다 */
export function keepFocusForDesktop(input: HTMLInputElement) {
  const desktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!desktop) {
    return;
  }
  input.focus({ preventScroll: true });
  window.addEventListener("keydown", (e) => {
    if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }
    if (document.activeElement !== input) {
      input.focus({ preventScroll: true });
    }
  });
}
