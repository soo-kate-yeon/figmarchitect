# Figma Plugin Development Guidelines

Figma 플러그인 개발 시 반드시 준수해야 하는 환경 설정 및 제약사항을 정리한 문서입니다.

---

## 1. JavaScript Target Version

### 요구사항
- **esbuild target: `es2017`** (또는 그 이하)
- Figma 플러그인 샌드박스는 최신 JavaScript 기능을 지원하지 않음

### 잘못된 설정
```javascript
// esbuild.config.js - 오류 발생 가능
{
  target: 'es2020', // ❌ Figma에서 호환성 문제 발생
}
```

### 올바른 설정
```javascript
// esbuild.config.js
{
  target: 'es2017', // ✅ Figma 호환
}
```

### 주의사항
- ES2018+ 문법 (optional chaining `?.`, nullish coalescing `??` 등)은 트랜스파일 필요
- async/await는 es2017에서 지원됨

---

## 2. Dynamic Import 제한 (Sandbox Security)

### 에러 메시지
```
possible import expression rejected
```

### 원인
Figma는 보안상 동적 코드 실행을 차단합니다. 다음 구문들이 번들에 포함되면 에러 발생:

| 차단되는 구문 | 설명 |
|-------------|------|
| `import()` | 동적 import 표현식 |
| `require()` | CommonJS require |
| `new Function()` | 동적 함수 생성 |
| `eval()` | 동적 코드 실행 |

### 해결 방법

#### 2.1 esbuild에서 동적 import 방지
```javascript
// esbuild.config.js
{
  bundle: true,
  format: 'iife',           // ✅ CommonJS/ESM 대신 IIFE 사용
  target: 'es2017',
  // dynamic import를 external로 처리하지 않음
}
```

#### 2.2 라이브러리 선택 시 주의
일부 라이브러리는 내부적으로 동적 import를 사용합니다:

```javascript
// ❌ 문제가 될 수 있는 패턴
const module = await import('./module.js');

// ✅ 정적 import 사용
import { something } from './module.js';
```

#### 2.3 조건부 로딩 대안
```javascript
// ❌ 동적 import (차단됨)
if (condition) {
  const lib = await import('some-lib');
}

// ✅ 정적 import 후 조건부 사용
import * as lib from 'some-lib';
if (condition) {
  lib.doSomething();
}
```

---

## 3. esbuild 권장 설정 (전체)

```javascript
// esbuild.config.js
const esbuild = require('esbuild');

// code.ts (Plugin Sandbox)
esbuild.build({
  entryPoints: ['src/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  format: 'iife',           // ✅ 필수: IIFE 형식
  target: 'es2017',         // ✅ 필수: ES2017 이하
  minify: true,
  sourcemap: false,         // Figma에서 sourcemap 불필요
  define: {
    'process.env.NODE_ENV': '"production"'
  },
});

// ui.html용 (UI Thread - 더 유연함)
esbuild.build({
  entryPoints: ['src/ui.tsx'],
  bundle: true,
  outfile: 'dist/ui.js',
  format: 'iife',
  target: 'es2017',         // UI도 동일하게 맞추는 것이 안전
  minify: true,
});
```

---

## 4. 추가 제약사항

### 4.1 네트워크 요청
- `fetch()`는 **UI thread에서만** 사용 가능
- Plugin sandbox (code.ts)에서는 네트워크 요청 불가
- UI ↔ Plugin 간 `postMessage`로 데이터 전달 필요

### 4.2 DOM 접근
- Plugin sandbox에서 DOM 접근 불가
- `document`, `window` 객체 사용 불가 (code.ts)
- UI thread (ui.html)에서만 DOM 조작 가능

### 4.3 파일 시스템
- 파일 시스템 접근 완전 차단
- `fs`, `path` 등 Node.js 모듈 사용 불가

### 4.4 Web Workers
- Web Workers 생성 불가
- `new Worker()` 차단됨

---

## 5. 디버깅 팁

### 번들 내용 확인
```bash
# 번들된 파일에서 금지된 패턴 검색
grep -E "(import\s*\(|require\s*\(|new Function|eval\s*\()" dist/code.js
```

### 문제 라이브러리 식별
```javascript
// esbuild에서 metafile 옵션으로 의존성 분석
esbuild.build({
  // ...
  metafile: true,
}).then(result => {
  console.log(result.metafile);
});
```

---

## 6. 체크리스트

개발/배포 전 확인사항:

- [ ] esbuild target이 `es2017` 이하인가?
- [ ] format이 `iife`인가?
- [ ] 동적 import (`import()`)를 사용하지 않는가?
- [ ] `require()` 구문이 번들에 포함되지 않는가?
- [ ] `eval()` 또는 `new Function()`을 사용하지 않는가?
- [ ] 외부 라이브러리가 위 패턴을 사용하지 않는가?
- [ ] 네트워크 요청은 UI thread에서만 하는가?

---

## 참고 자료

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Figma Plugin Sandbox Limitations](https://www.figma.com/plugin-docs/how-plugins-run/)
