import { Button, Card, Input } from '@menvi/ui';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <Card className="w-full space-y-4">
        <h1 className="text-2xl font-bold">Login CRM</h1>
        <Input placeholder="E-mail" type="email" />
        <Input placeholder="Senha" type="password" />
        <Button className="w-full">Entrar</Button>
      </Card>
    </main>
  );
}
