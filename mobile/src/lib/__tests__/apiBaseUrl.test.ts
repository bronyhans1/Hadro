import { isLoopbackHostname, packagerHostname, resolveApiBaseUrl } from "../api/apiBaseUrl";

describe("apiBaseUrl", () => {
  it("treats 127.x.x.x as loopback (not a LAN address)", () => {
    expect(isLoopbackHostname("127.20.10.6")).toBe(true);
    expect(isLoopbackHostname("127.0.0.1")).toBe(true);
    expect(isLoopbackHostname("localhost")).toBe(true);
    expect(isLoopbackHostname("172.20.10.6")).toBe(false);
  });

  it("parses Expo hostUri", () => {
    expect(packagerHostname("172.20.10.6:8081")).toBe("172.20.10.6");
    expect(packagerHostname("exp://172.20.10.6:8081")).toBe("172.20.10.6");
  });

  it("rewrites loopback API URL to the Metro host on native", () => {
    expect(
      resolveApiBaseUrl("http://127.20.10.6:5000", {
        platform: "android",
        packagerHostUri: "172.20.10.6:8081",
      })
    ).toBe("http://172.20.10.6:5000");
  });

  it("does not rewrite LAN URLs", () => {
    expect(
      resolveApiBaseUrl("http://172.20.10.6:5000", {
        platform: "android",
        packagerHostUri: "172.20.10.6:8081",
      })
    ).toBe("http://172.20.10.6:5000");
  });

  it("keeps localhost on web", () => {
    expect(
      resolveApiBaseUrl("http://localhost:5000", {
        platform: "web",
        packagerHostUri: "172.20.10.6:8081",
      })
    ).toBe("http://localhost:5000");
  });
});
