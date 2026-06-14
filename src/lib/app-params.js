// Clean placeholder parameters to maintain backward compatibility across older UI page wrappers
export const appParams = {
  appId: "supabase-managed",
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : "",
  functionsUrl: ""
};

export const getAppParams = () => appParams;
