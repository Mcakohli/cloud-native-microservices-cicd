export const metadata = {
  title: 'Task Processor - DevOps Assessment',
  description: 'Full-stack background task processing pipeline',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}