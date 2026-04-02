let getTokenFn = async () => null;

export function setClerkTokenGetter(fn) {
  getTokenFn = typeof fn === "function" ? fn : async () => null;
}

export async function getClerkBearerToken() {
  try {
    const t = await getTokenFn();
    return t || null;
  } catch {
    return null;
  }
}
