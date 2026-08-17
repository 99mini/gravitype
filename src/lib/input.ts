// 글자 입력 + IME 조합 처리 (PRD §4.1, §6).
//
// 모바일 키보드는 표준 composition 이벤트를 따르지 않는 경우가 있다.
// 특히 "일단 커밋하고 다음 자모가 오면 지우고 교체"하는 키보드에서는
// 값을 즉시 스폰하고 비워버리면 조합이 끊겨 자모가 따로 떨어진다.
//
// 그래서 input.value 를 버퍼로 두고 "정착(settle)" 시점에만 스폰한다:
// - 조합 중(composition / insertCompositionText)에는 아무것도 하지 않는다
// - 조합이 끝나면 즉시 settle 예약 — 새 조합이 이미 시작됐으면 자동 스킵
// - 조합 이벤트 없이 값이 바뀌는 키보드는, 마지막 글자가 아직 변할 수 있는
//   한글(자모·음절)이면 잠깐(HANGUL_SETTLE_MS) 기다렸다가 settle 한다.
//   그 사이 키보드가 값을 교체하면 교체된 결과가 스폰된다.
// - 그 외(영문·숫자·기호)는 즉시 settle

export interface InputHooks {
  /** 확정된 글자 하나 (공백·개행 제외) */
  onChar: (char: string) => void;
}

/** 커밋-교체형 키보드가 마지막 글자를 바꿀 시간 여유 */
const HANGUL_SETTLE_MS = 300;

/** 마지막 글자가 아직 변할 수 있는 한글: 호환 자모(ㄱ-ㅣ) 또는 완성 음절(가-힣) */
const MUTABLE_HANGUL_TAIL = /[ㄱ-ㆎ가-힣]$/;

export function wireLetterInput(input: HTMLInputElement, hooks: InputHooks) {
  input.autocomplete = "off";
  input.autocapitalize = "off";
  input.spellcheck = false;
  input.setAttribute("autocorrect", "off");
  input.setAttribute("enterkeyhint", "done");

  let composing = false;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  function settle() {
    if (composing) {
      return; // 새 조합이 시작됐다 — 그 조합의 settle 때 함께 스폰된다
    }
    if (!input.value) {
      return;
    }
    for (const char of input.value) {
      if (char.trim() !== "") {
        hooks.onChar(char);
      }
    }
    input.value = "";
  }

  function scheduleSettle(delayMs: number) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, delayMs);
  }

  input.addEventListener("compositionstart", () => {
    composing = true;
    clearTimeout(settleTimer);
  });

  input.addEventListener("compositionend", () => {
    composing = false;
    // 연속 타이핑으로 새 조합이 바로 시작되면 settle 이 스킵되고,
    // 확정분은 버퍼에 남아 다음 settle 때 순서대로 스폰된다
    scheduleSettle(0);
  });

  input.addEventListener("input", (e) => {
    const ie = e as InputEvent;
    if (composing || ie.isComposing || ie.inputType === "insertCompositionText") {
      return; // 표준 조합 — compositionend 가 처리한다
    }
    if (MUTABLE_HANGUL_TAIL.test(input.value)) {
      scheduleSettle(HANGUL_SETTLE_MS);
    } else {
      scheduleSettle(0);
    }
  });

  // 키보드가 닫히면 남은 버퍼를 그대로 떨어뜨린다
  input.addEventListener("blur", () => {
    composing = false;
    clearTimeout(settleTimer);
    settle();
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
