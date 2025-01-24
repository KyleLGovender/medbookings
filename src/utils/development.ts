import env from "@/config/env/server";

const devLog = (...args: any[]) => {
  if (env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

export default devLog;
