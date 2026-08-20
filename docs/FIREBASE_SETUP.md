# Firebase 설정 가이드

이 프로젝트는 Firebase Authentication과 Firestore를 선택적으로 사용합니다. Firebase 환경 변수가 없으면 로컬 모드로 동작합니다.

## 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com/ 에 접속합니다.
2. 새 프로젝트를 생성합니다.
3. 프로젝트 이름을 입력하고, Google Analytics는 선택 사항으로 비활성화해도 됩니다.

## 2. 웹 앱 등록

1. 프로젝트 홈 > `</>` 아이콘 클릭
2. 앱 이름 입력
3. Firebase SDK 구성 정보 복사
4. 아래 값을 `.env.local`에 저장합니다.

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 3. 인증 활성화

1. Firebase Console > Authentication > Sign-in method
2. `Anonymous` 를 활성화합니다.
3. 필요하면 Google 로그인도 추가할 수 있습니다.

## 4. Firestore 생성

1. Firestore Database 생성
2. 위치 선택
3. 보안 규칙은 테스트 모드로 생성 후, 아래 규칙으로 교체합니다.

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{uid} {
      allow read: if true;
      allow create, update: if request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 5. 앱 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

환경 변수가 설정되면 자동으로 게스트 로그인과 리더보드 저장 기능이 활성화됩니다.

## 6. GitHub Pages 배포

1. GitHub 저장소에 코드를 push합니다.
2. `main` 브랜치에 변경이 생기면 `.github/workflows/deploy.yml` 이 자동 실행됩니다.
3. 저장소 Settings > Pages에서 배포 결과를 확인합니다.

## 7. 운영 팁

- Firebase 값이 없는 상태에서도 기본 게임은 동작합니다.
- 실제 순위 경쟁은 `leaderboard` 컬렉션이 활성화된 뒤부터 반영됩니다.
- 앱은 로컬 점수와 서버 점수를 함께 합쳐서 상위 순위를 보여주도록 설계되어 있습니다.
