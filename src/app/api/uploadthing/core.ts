import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getEmployerEmployeeUser } from "~/lib/auth/employer-employee";

const f = createUploadthing();

export const ourFileRouter = {
    pdfUploader: f({
        pdf: {
            maxFileSize: "16MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            const user = await getEmployerEmployeeUser();
            if (!user) throw new Error("Unauthorized");

            return { userId: user.userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {

            return {
                uploadedBy: metadata.userId,
                fileUrl: file.url,
                filename: file.name,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;