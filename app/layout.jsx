import './globals.css';

export const metadata = {
  title: 'SmartStore Prompt Gen AI',
  description: '최소한의 입력으로 완벽한 스마트스토어 상세페이지 이미지 생성 프롬프트를 만드세요',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
