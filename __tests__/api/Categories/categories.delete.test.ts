import { DELETE } from "~/app/api/Categories/DeleteCategories/route";
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
    delete: jest.fn(),
  },
}));

describe("DELETE /api/Categories/DeleteCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow an authenticated employer to delete a category", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 123 },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "employer-user-123",
      role: "employer",
      companyId: 1,
    });

    const mockDelete = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });
    (db.delete as jest.Mock) = mockDelete;

    const request = new Request("http://localhost/api/Categories/DeleteCategories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 123 }),
    });

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("should allow an authenticated owner to delete a category", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 456 },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "owner-user-456",
      role: "owner",
      companyId: 2,
    });

    const mockDelete = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });
    (db.delete as jest.Mock) = mockDelete;

    const request = new Request("http://localhost/api/Categories/DeleteCategories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 456 }),
    });

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("should return 400 if user is not found", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 123 },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/Categories/DeleteCategories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "123" }),
    });

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid user role.");
  });

  it("should return 400 if user has invalid role (employee)", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 123 },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "employee-user-789",
      role: "employee",
      companyId: 3,
    });

    const request = new Request("http://localhost/api/Categories/DeleteCategories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 123 }),
    });

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid user role.");
  });

  it("should return validation error if id is missing", async () => {
    // Mock failed validation
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({ error: "Category ID is required" }),
        { status: 400 }
      ),
    });

    const request = new Request("http://localhost/api/Categories/DeleteCategory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "" }), // Empty id
    });

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Category ID is required");
  });

  it("should return validation error if id is not provided", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({ error: "Category ID is required" }),
        { status: 400 }
      ),
    });

    const request = new Request("http://localhost/api/Categories/DeleteCategories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // No id field
    });

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Category ID is required");
  });

  it("should return 500 on database error", async () => {
    (validateRequestBody as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 123 },
    });

    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-123",
      role: "employer",
      companyId: 1,
    });

    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockRejectedValue(new Error("Database error")),
    });

    const request = new Request("http://localhost/api/Categories/DeleteCategories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 123 }),
    });

    const response = await DELETE(request);

    expect(response.status).toBe(500);
  });
});