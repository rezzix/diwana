import Spinner from './Spinner';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Spinner className="h-8 w-8 text-primary-600" />
    </div>
  );
}
