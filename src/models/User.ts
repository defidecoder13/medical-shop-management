import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    },
    { timestamps: true }
);

// Force Schema Reload in Dev
if (process.env.NODE_ENV !== "production") {
    if (mongoose.models.User) {
        delete mongoose.models.User;
    }
}

export default mongoose.models.User || mongoose.model("User", UserSchema);
