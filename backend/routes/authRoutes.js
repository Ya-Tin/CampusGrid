import express from "express";
import supabase from "../config/supabaseClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// POST: Register a Student
router.post("/student/register", async (req, res) => {
    const { first_name, last_name, email, password, student_id, branch, semester } = req.body;

    try {
        // Check if the user already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from("students")
            .select("*")
            .eq("email", email)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            console.error(fetchError);
            return res.status(400).json({ status: false, message: "Error checking user existence", error: fetchError });
        }

        if (existingUser) {
            return res.status(409).json({ status: false, message: "User already exists" });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user data into the database
        const { data, error } = await supabase
            .from("students")
            .insert([
                { first_name, last_name, email, password: hashedPassword, student_id, branch, semester }
            ]);

        if (error) {
            console.error(error);
            return res.status(400).json({ status: false, message: "Error inserting data", error });
        }

        return res.status(200).json({ status: true, message: "Student registered successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: "Server error", err });
    }
});

// POST: Register a Professor
router.post("/professor/register", async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        // Check if the user already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from("professors")
            .select("*")
            .eq("email", email)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            console.error(fetchError);
            return res.status(400).json({ status: false, message: "Error checking user existence", error: fetchError });
        }

        if (existingUser) {
            return res.status(409).json({ status: false, message: "User already exists" });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user data into the database
        const { data, error } = await supabase
            .from("professors")
            .insert([
                { first_name, last_name, email, password: hashedPassword }
            ]);

        if (error) {
            console.error(error);
            return res.status(400).json({ status: false, message: "Error inserting data", error });
        }

        return res.status(200).json({ status: true, message: "Professor registered successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: "Server error", err });
    }
});

// POST: Login a Student
router.post("/student/login", async (req, res) => {
    const { email, password, roleData } = req.body;

    try {
        // Fetch user by email
        const { data: student, error } = await supabase
            .from("students")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !student) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: student.id, role: roleData.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({ status: true, message: "Login successful", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: "Server error", err });
    }
});

// POST: Login a Professor
router.post("/professor/login", async (req, res) => {
    const { email, password, roleData } = req.body;

    try {
        // Fetch user by email
        const { data: professor, error } = await supabase
            .from("professors")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !professor) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, professor.password);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: professor.id, role: roleData.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({ status: true, message: "Login successful", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: "Server error", err });
    }
});

// POST: Fetching Details of Student
router.post("/student/details", async (req, res) => {
    const { id } = req.body

    try {
        const { data: student, error } = await supabase
            .from("students")
            .select("id, first_name, last_name, email, branch, semester, student_id")
            .eq("id", id)
            .single();

        if (error || !student) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        const requiredData = {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            branch: student.branch,
            semester: student.semester,
            student_id: student.student_id
        }

        return res.status(200).json({ status: true, message: "Fetch Successful", requiredData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: "Server error", err });
    }
})

// POST: Fetching Details of Professor
router.post("/professor/details", async (req, res) => {
    const { professor_id } = req.body

    try {
        const { data: professor, error } = await supabase
            .from("professors")
            .select("id, first_name, last_name, email")
            .eq("id", professor_id)
            .single();

        if (error || !professor) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        const requiredData = {
            id: professor.id,
            first_name: professor.first_name,
            last_name: professor.last_name,
            email: professor.email,
        }

        return res.status(200).json({ status: true, message: "Fetch successful", requiredData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: "Server error", err });
    }
})

export default router;

