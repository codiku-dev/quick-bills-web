import PlaidLink from './components/PlaidLink';
import { GoCardlessLink } from './components/GoCardlessLink';
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* <PlaidLink /> */}
      <GoCardlessLink />
    </main>
  );
}
