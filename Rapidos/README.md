# AutoTestPilot 🚀

![AutoTestPilot](https://img.shields.io/badge/Status-Beta-blue)
![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF)
![React](https://img.shields.io/badge/React-18-61DAFB)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Overview

AutoTestPilot is an AI-powered application generator that transforms Figma designs into production-ready websites with comprehensive testing capabilities. This tool streamlines the development process by automating code generation and quality assurance testing.

<p align="center">
  <img src="docs/workflow.png" alt="AutoTestPilot Workflow" width="800">
</p>

## ✨ Features

- **Figma to Code Conversion**: Transform any Figma design into functional HTML, CSS, and JavaScript code
- **Automated Requirements Generation**: Extract functional requirements directly from design files
- **Test Case Generation**: Create comprehensive test scenarios based on requirements
- **Dual Testing Environment**: 
  - Local testing via integrated testing engine
  - Cloud testing via GitHub Actions for performance, accessibility, and compatibility
- **Detailed Test Reports**: Visual reports with metrics, pass/fail status, and recommendations
- **Modern UI**: Clean, responsive interface with glassmorphism design elements

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- A Gemini API key from Google AI Studio

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/autotestpilot.git
   cd autotestpilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with your API keys (or update them in ApiService.jsx):
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Usage

1. Enter a valid Figma URL in the input field
2. Wait for the application to extract design elements and generate requirements
3. Review and approve the generated code
4. Examine test cases and scenarios created based on requirements
5. Run automated tests to verify code quality
6. Review both local test results and GitHub-based cloud test results
7. Use the test report to identify and fix issues

## 🧪 Testing Workflow

AutoTestPilot features an advanced testing workflow:

1. **Local Testing**: Runs quick tests directly in the application
   - Functional tests
   - Basic interactivity tests
   - Component rendering tests

2. **GitHub Actions Testing**: Comprehensive cloud-based testing
   - Performance testing (Lighthouse)
   - Accessibility testing (Axe)
   - Responsive design testing (Desktop/Mobile)
   - Standards compliance testing

## 🔄 CI/CD Integration

AutoTestPilot seamlessly integrates with GitHub Actions to provide continuous testing capabilities:

1. Generated code is automatically submitted to GitHub Actions
2. Comprehensive test suite runs against the generated code
3. Test results are returned to the application interface
4. Reports highlight performance, accessibility, and compatibility issues

## 📚 Project Structure

```
/src
├── App.jsx                 # Main application component
├── components/             # React components
│   ├── ApiService.jsx      # Handles API communication
│   ├── RequirementsGenerator.jsx # Generates requirements
│   ├── ApplicationGenerator.jsx  # Generates application code
│   ├── TestCases.jsx       # Manages test cases
│   ├── TestScenarios.jsx   # Manages test scenarios
│   ├── AutomatedTesting.jsx # Runs automated tests
│   └── TestReport.jsx      # Displays test results
├── assets/                 # Static assets
└── styles/                 # CSS files
```

## 🔒 Security

This application uses API keys for the Gemini API. These should be kept secure and not committed to public repositories.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev/docs) for AI-powered code generation
- [Figma API](https://www.figma.com/developers/api) for design data extraction
- [React](https://reactjs.org/) for the frontend framework
- [Vite](https://vitejs.dev/) for the build system
