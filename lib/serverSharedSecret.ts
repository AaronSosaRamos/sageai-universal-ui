/** Misma clave que el backend; prioridad: NEXT_PUBLIC_BACKEND_SECRET_VALUE. */
export function getServerSharedSecret(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_BACKEND_SECRET_VALUE ??
    process.env.BACKEND_SECRET_VALUE ??
    process.env.SECRET_VALUE
  );
}
