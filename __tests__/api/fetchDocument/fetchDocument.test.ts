import { POST } from "~/app/api/fetchDocument/route";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";
import { db } from "~/server/db/index";

jest.mock("~/lib/auth/employer-employee", () => ({
  getEmployerEmployeeUser: jest.fn(),
}));

jest.mock("~/server/db/index", () => ({
  db: {
    select: jest.fn(),
  },
}));

describe("POST /api/fetchDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully fetch documents for authenticated user", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-123",
      role: "employer",
      companyId: 1,
    });

    const mockDocuments = [
      { id: 1, name: "Document 1", companyId: 1, content: "Content 1" },
      { id: 2, name: "Document 2", companyId: 1, content: "Content 2" },
      { id: 3, name: "Document 3", companyId: 1, content: "Content 3" },
    ];

    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost/api/fetchDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockDocuments);
    expect(json).toHaveLength(3);
  });

  it("should return empty array if no documents exist for company", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-456",
      role: "employer",
      companyId: 2,
    });

    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost/api/fetchDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual([]);
    expect(json).toHaveLength(0);
  });

  it("should return 400 if user is not found", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/fetchDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid user.");
  });

  it("should return 500 on database error during documents fetch", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-123",
      role: "employer",
      companyId: 1,
    });

    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error("Failed to fetch documents")),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost/api/fetchDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Unable to fetch documents");
  });

  it("should only return documents for the user's company", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-123",
      role: "employer",
      companyId: 1,
    });

    const mockDocuments = [
      { id: 1, name: "Company 1 Doc", companyId: 1 },
      { id: 2, name: "Another Company 1 Doc", companyId: 1 },
    ];

    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost/api/fetchDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    json.forEach((doc: { companyId: number }) => {
      expect(doc.companyId).toBe(1);
    });
  });

  it("should handle user with different companyId", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "test-user-789",
      role: "employee",
      companyId: 5,
    });

    const mockDocuments = [
      { id: 10, name: "Company 5 Doc", companyId: 5 },
      { id: 11, name: "Another Company 5 Doc", companyId: 5 },
    ];

    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost/api/fetchDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveLength(2);
    json.forEach((doc: { companyId: number }) => {
      expect(doc.companyId).toBe(5);
    });
  });

  it("should work for any user role (no role restriction)", async () => {
    (getEmployerEmployeeUser as jest.Mock).mockResolvedValue({
      userId: "employee-user-111",
      role: "employee",
      companyId: 3,
    });

    const mockDocuments = [{ id: 20, name: "Employee Doc", companyId: 3 }];

    const mockSelect = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockDocuments),
      }),
    });
    (db.select as jest.Mock) = mockSelect;

    const request = new Request("http://localhost/api/fetchDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockDocuments);
  });
});
