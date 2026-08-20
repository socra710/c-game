# 방치형 코딩 게임 설계 문서

**날짜:** 2026-08-20  
**프로젝트:** c-game  
**대상:** 개발 회사 내부 직원용

---

## 개요

개발 회사 직원들이 함께 즐길 수 있는 방치형 코딩 게임. 쿠키클리커 스타일로, 코드를 클릭하거나 방치해서 자동으로 코드 줄을 생산하고, 업그레이드를 구매해 생산 속도를 높인다. 리더보드에서 동료와 순위를 겨룬다.

---

## 핵심 게임플레이

### 게임 루프
1. **클릭**: 화면 중앙 버튼 클릭 → 클릭당 N줄 코드 즉시 생성
2. **방치**: 구매한 업그레이드에 따라 초당 자동으로 코드 생산
3. **업그레이드 구매**: 누적 코드로 업그레이드 구매 → 생산속도/클릭효율 증가
4. **반복**: 자원이 쌓일수록 더 강력한 업그레이드 구매 가능

### 순위 기준
- **총 누적 코드 줄 수** (생산된 전체 합산, 소비된 것 포함)

### 업그레이드 목록 (개발 직군 테마)
| 이름 | 비용 | 초당 생산 |
|------|------|----------|
| Junior Dev | 10줄 | 0.1줄/초 |
| Senior Dev | 100줄 | 1줄/초 |
| Tech Lead | 500줄 | 5줄/초 |
| AI 어시스턴트 | 2,000줄 | 20줄/초 |
| Copilot Pro | 10,000줄 | 100줄/초 |
| Full Autopilot | 50,000줄 | 500줄/초 |

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React + Vite + TypeScript |
| 인증 | Firebase Authentication (이메일/구글) |
| 데이터베이스 | Firestore (유저 데이터 + 리더보드) |
| 배포 | GitHub Pages |
| CI/CD | GitHub Actions (main 브랜치 푸시 시 자동 배포) |

---

## 아키텍처

```
[브라우저 - React SPA]
  ├── 게임 화면 (클릭, 자동생산, 업그레이드 구매)
  ├── 리더보드 화면 (실시간 순위)
  └── 로그인 화면
        ↕
[Firebase Auth] 로그인 처리
        ↕
[Firestore]
  ├── users/{uid} - 유저 게임 상태 (누적코드, 업그레이드 보유수)
  └── leaderboard - 상위 N명 실시간 순위
```

## 파일 구조

```
src/
  game/
    constants.ts      # 업그레이드 정의, 게임 상수
    gameEngine.ts     # 클릭 처리, 자동생산 계산 로직
  components/
    ClickButton.tsx   # 메인 클릭 버튼
    UpgradePanel.tsx  # 업그레이드 목록 및 구매
    Leaderboard.tsx   # 실시간 순위표
    LoginScreen.tsx   # 로그인 화면
  firebase/
    config.ts         # Firebase 초기화
    auth.ts           # 로그인/로그아웃
    db.ts             # Firestore CRUD
  hooks/
    useGameState.ts   # 게임 상태 관리 (로컬 + Firestore 동기화)
    useLeaderboard.ts # 리더보드 실시간 구독
  App.tsx
  main.tsx
```

---

## 데이터 모델

### Firestore: `users/{uid}`
```json
{
  "displayName": "홍길동",
  "totalLines": 12345,
  "currentLines": 500,
  "upgrades": {
    "junior_dev": 3,
    "senior_dev": 1
  },
  "lastSaved": "2026-08-20T17:00:00Z"
}
```

### Firestore: `leaderboard/{uid}`
```json
{
  "displayName": "홍길동",
  "totalLines": 12345,
  "updatedAt": "2026-08-20T17:00:00Z"
}
```

---

## 게임 저장 전략

- 게임 상태는 **로컬(메모리)** 에서 실시간 처리 (60fps 업데이트)
- **Firestore 동기화**: 30초마다 또는 업그레이드 구매 시 저장
- 리더보드는 저장 시 동시에 업데이트

---

## 에러 처리

- Firebase 연결 끊김: 로컬에 계속 플레이, 재연결 시 자동 동기화
- 로그인 실패: 명확한 에러 메시지 표시
- 데이터 저장 실패: 재시도 로직 (최대 3회)

---

## 배포 계획

1. `main` 브랜치에 push
2. GitHub Actions 트리거 → `vite build`
3. `gh-pages` 브랜치로 자동 배포
4. `https://<username>.github.io/c-game/` 접근 가능

---

## MVP 범위

- [x] 클릭으로 코드 생성
- [x] 자동 생산 (업그레이드)
- [x] 이메일/구글 로그인
- [x] 실시간 리더보드
- [x] GitHub Pages 배포

**MVP 제외 (추후 고려):**
- 프레스티지(초기화 후 보너스) 시스템
- 도전과제/뱃지
- 채팅/댓글
