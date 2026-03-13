import { POST } from "~/app/api/updateCompany/route";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";
import { validateRequestBody } from "~/lib/validation";
import { db } from "~/server/db/index";

jest.mock("~/lib/auth/employer-employee", () => ({
  getEmployerEmployeeUser: jest.fn(),
}));

jest.mock("~/lib/validation", () => {
  const actual = jest.requireActual("~/lib/validation");
  return {
    ...actual,
    validateRequestBody: jest.fn(),
  };
});

jest.mock("~/server/db/index", () => ({
  db: {
    update: jest.fn(),
  },
}));

describe("POST /api/updateCompany", () => {
  const makeRequest = (body: unknown) =>
    new Request("http://localhost/api/updateCompany", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates company settings for authorized employer", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      id: 1,
      companyId: 7,
      role: "employer",
    });

    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: "Acme Corp",
        employerPasskey: "EMP123",
        employeePasskey: "EMP456",
        numberOfEmployees: "25",
      },
    });

    const mockReturning = jest.fn().mockResolvedValue([{ id: 7 }]);
    const mockWhereUpdate = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhereUpdate });
    (db.update as jest.Mock).mockReturnValue({ set: mockSet });

    const response = await POST(makeRequest({
      name: "Acme Corp",
      employerPasskey: "EMP123",
      employeePasskey: "EMP456",
      numberOfEmployees: "25",
    }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      message: "Company settings updated.",
    });
    expect(mockSet).toHaveBeenCalledWith({
      name: "Acme Corp",
      employerpasskey: "EMP123",
      employeepasskey: "EMP456",
      numberOfEmployees: "25",
    });
    expect(mockWhereUpdate).toHaveBeenCalled();
  });

  it("returns 401 when user is not authenticated", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: "Acme",
        employerPasskey: "EMP",
        employeePasskey: "EMP2",
        numberOfEmployees: "10",
      },
    });
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue(null);

    const response = await POST(makeRequest({
      name: "Acme",
      employerPasskey: "EMP",
      employeePasskey: "EMP2",
      numberOfEmployees: "10",
    }));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({
      success: false,
      message: "Unauthorized",
    });
  });

  it("returns 403 when user lacks employer privileges", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      id: 1,
      companyId: 7,
      role: "employee",
    });

    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: "Acme Corp",
        employerPasskey: "EMP123",
        employeePasskey: "EMP456",
        numberOfEmployees: "10",
      },
    });

    const response = await POST(makeRequest({
      name: "Acme Corp",
      employerPasskey: "EMP123",
      employeePasskey: "EMP456",
      numberOfEmployees: "10",
    }));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      success: false,
      message: "Forbidden",
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("bubbles validation failure response", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      id: 1,
      companyId: 7,
      role: "employer",
    });

    const validationResponse = new Response(
      JSON.stringify({ success: false, message: "Invalid payload" }),
      { status: 400 }
    );

    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: false,
      response: validationResponse,
    });

    const response = await POST(makeRequest({}));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ success: false, message: "Invalid payload" });
  });

  it("returns 404 when company record is missing", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      id: 1,
      companyId: 7,
      role: "owner",
    });

    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: "Acme Corp",
        employerPasskey: "EMP123",
        employeePasskey: "EMP456",
        numberOfEmployees: "15",
      },
    });

    const mockReturning = jest.fn().mockResolvedValue([]);
    const mockWhereUpdate = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhereUpdate });
    (db.update as jest.Mock).mockReturnValue({ set: mockSet });

    const response = await POST(makeRequest({
      name: "Acme Corp",
      employerPasskey: "EMP123",
      employeePasskey: "EMP456",
      numberOfEmployees: "15",
    }));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({
      success: false,
      message: "Unable to update company record.",
    });
  });
});
