import { POST } from "~/app/api/Categories/AddCategories/route";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";
import { validateRequestBody } from "~/lib/validation";
import { db } from "~/server/db/index";

jest.mock("~/lib/auth/employer-employee", () => ({
  getEmployerEmployeeUser: jest.fn(),
}));

jest.mock("~/lib/validation", () => ({
  validateRequestBody: jest.fn(),
}));

jest.mock("~/server/db/index", () => ({
  db: {
    insert: jest.fn(),
  },
}));

describe("POST /api/Categories/AddCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow an authenticated employer to create a category", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { CategoryName: "Test Category" },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-123",
      role: "employer",
      companyId: 1,
    });

    // Mock database insert (category creation)
    const mockInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
    });
    (db.insert as jest.Mock) = mockInsert;

    const request = new Request("http://localhost/api/Categories/AddCategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CategoryName: "Test Category" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.name).toBe("Test Category");
    expect(json.id).toEqual({ id: 1 });
  });

  it("should allow an authenticated owner to create a category", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { CategoryName: "Owner Category" },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "owner-user-456",
      role: "owner",
      companyId: 2,
    });

    const mockInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 2 }]),
      }),
    });
    (db.insert as jest.Mock) = mockInsert;

    const request = new Request("http://localhost/api/Categories/AddCategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CategoryName: "Owner Category" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.name).toBe("Owner Category");
  });

  it("should return 400 if user is not found (invalid userId)", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { CategoryName: "Test Category" },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/Categories/AddCategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CategoryName: "Test Category" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid user.");
  });

  it("should return 400 if user has invalid role (employee)", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { CategoryName: "Test Category" },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "employee-user-789",
      role: "employee",
      companyId: 3,
    });

    const request = new Request("http://localhost/api/Categories/AddCategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CategoryName: "Test Category" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid user.");
  });

  it("should return validation error if CategoryName is invalid", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({ error: "Category name is required" }),
        { status: 400 }
      ),
    });

    const request = new Request("http://localhost/api/Categories/AddCategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CategoryName: "" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Category name is required");
  });

  it("should return 500 on database error", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { CategoryName: "Test Category" },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-123",
      role: "employer",
      companyId: 1,
    });

    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockRejectedValue(new Error("Database connection failed")),
      }),
    });

    const request = new Request("http://localhost/api/Categories/AddCategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ CategoryName: "Test Category" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

});