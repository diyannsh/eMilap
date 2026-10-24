export interface HealthResponse {
  data: {
    status: "ok";
    service: string;
    dependencies?: Record<string, string | boolean>;
  };
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId?: string;
    fieldErrors?: Record<string, string[]>;
  };
}
