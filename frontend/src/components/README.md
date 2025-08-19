# RAGnarok Frontend Components Documentation

This document provides comprehensive documentation for the React frontend components in the RAGnarok application.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Core Components](#core-components)
3. [State Management](#state-management)
4. [Data Flow](#data-flow)
5. [Styling](#styling)
6. [Performance Optimizations](#performance-optimizations)
7. [Error Handling](#error-handling)
8. [Testing Strategy](#testing-strategy)

## Component Architecture

The RAGnarok frontend follows a modular component architecture with clear separation of concerns:

```
src/
├── components/
│   └── README.md (this file)
├── App.js (root component)
├── HomePage.jsx (main layout)
├── UploadCard.jsx (PDF upload)
├── PDFListCard.jsx (document management)
├── LLMInteractCard.jsx (AI chat interface)
├── FireBackground.jsx (animated background)
├── index.js (entry point)
├── index.css (global styles)
└── styles.css (component styles)
```

### Design Principles

- **Single Responsibility**: Each component has a focused, well-defined purpose
- **Composition**: Components are composed together to build complex interfaces
- **Reusability**: Components are designed to be reusable across different contexts
- **Performance**: Optimized for smooth animations and responsive interactions

## Core Components

### 1. HomePage.jsx

**Purpose**: Main layout component that orchestrates the application structure

**Key Features**:
- Tabbed sidebar interface (Upload/PDF List)
- Responsive layout with collapsible sidebar
- State management for active tab and sidebar visibility
- Integration with all child components

**Props**: None (root component)

**State**:
```javascript
{
  sidebarOpen: boolean,     // Controls sidebar visibility
  activeTab: string,        // 'upload' or 'pdfs'
}
```

**Key Methods**:
- `handlePDFUploaded()`: Switches to PDF list tab after successful upload
- Sidebar toggle functionality

### 2. UploadCard.jsx

**Purpose**: PDF file upload interface with drag-and-drop support

**Key Features**:
- Drag-and-drop file upload
- File validation (PDF only, size limits)
- Upload progress feedback
- Error handling and user notifications
- File size display

**Props**:
```javascript
{
  onPDFUploaded: function,  // Callback when upload succeeds
}
```

**State**:
```javascript
{
  dragActive: boolean,      // Drag-and-drop visual state
  selectedFile: File|null,  // Currently selected file
  uploading: boolean,       // Upload in progress
  uploadStatus: string,     // Status message
  statusType: string,       // 'success' | 'error' | 'info'
}
```

**Key Methods**:
- `handleDrop()`: Processes dropped files
- `handleFileSelect()`: Handles file input selection
- `handleUpload()`: Executes file upload to backend
- `clearStatus()`: Clears status messages

### 3. PDFListCard.jsx

**Purpose**: Displays and manages uploaded PDF documents

**Key Features**:
- Paginated document list
- Real-time processing status updates
- Search and filter functionality
- Responsive card-based layout
- Auto-refresh for pending documents

**Props**:
```javascript
{
  // Exposed via forwardRef for parent component access
  refreshPDFs: function,    // Method to refresh the PDF list
}
```

**State**:
```javascript
{
  pdfs: Array,              // List of PDF documents
  loading: boolean,         // Loading state
  error: string,            // Error message
  searchTerm: string,       // Search filter
  filterStatus: string,     // Status filter
  currentPage: number,      // Pagination
  totalPages: number,       // Total pages
  totalPDFs: number,        // Total document count
}
```

**Key Methods**:
- `fetchPDFs()`: Retrieves PDF list from API
- `getStatusIcon()`: Returns appropriate status icon
- `getStatusText()`: Returns formatted status text
- Auto-refresh interval for pending documents

### 4. LLMInteractCard.jsx

**Purpose**: AI chat interface with streaming responses

**Key Features**:
- Real-time streaming responses
- RAG context toggle
- Source attribution
- Error handling
- Typing indicators

**Props**:
```javascript
{
  maxWidth: number,         // Maximum component width (default: 700)
}
```

**State**:
```javascript
{
  prompt: string,           // User input
  response: string,         // Final LLM response
  streamingResponse: string,// Streaming response buffer
  sourcesUsed: Array,       // Source documents
  contextFound: boolean,    // RAG context availability
  isLoading: boolean,       // Initial loading state
  isStreaming: boolean,     // Streaming in progress
  useRag: boolean,          // RAG enabled/disabled
  error: string,            // Error messages
}
```

**Key Methods**:
- `handleSubmit()`: Initiates LLM request with streaming
- Server-Sent Events (SSE) processing
- Real-time response rendering

### 5. FireBackground.jsx

**Purpose**: Animated SVG fire background effect

**Key Features**:
- Realistic flame animations
- Varying flame heights and paths
- Multiple animation layers (flames, embers, smoke)
- CSS keyframe animations
- Performance-optimized SVG rendering

**Props**: None

**Key Features**:
- `flicker`: Flame movement animation
- `rise`: Ember floating animation
- `emberFloat`: Secondary ember movement
- `smokeRise`: Smoke wisp animation
- Gradient definitions for realistic fire colors

## State Management

### Local Component State

The application uses React's built-in `useState` hook for local component state management. No external state management library (Redux, Zustand) is used, keeping the architecture simple and lightweight.

### State Flow Patterns

1. **Parent-to-Child**: Props are passed down for configuration and callbacks
2. **Child-to-Parent**: Callbacks are used to communicate events upward
3. **Sibling Communication**: Mediated through common parent component

### Key State Synchronization

- **Upload → PDF List**: `onPDFUploaded` callback triggers list refresh
- **Tab Management**: Centralized in `HomePage` component
- **Sidebar State**: Shared across layout components

## Data Flow

### API Communication

```
Frontend Components → Fetch API → Flask Backend → Database/Vector Store
                   ←            ←              ←
```

### Streaming Data Flow (LLM)

```
LLMInteractCard → POST /api/llm → Ollama → Server-Sent Events → Real-time UI Updates
```

### Upload Flow

```
UploadCard → FormData → POST /api/upload → Background Processing → Status Updates
```

## Styling

### Styling Approach

- **Inline Styles**: Primary styling method for component-specific styles
- **CSS Classes**: Global styles and animations in separate CSS files
- **CSS-in-JS**: Some dynamic styles computed in JavaScript

### Design System

**Color Palette**:
- Primary: `#FFB347` (warm orange)
- Secondary: `#FF6600` (bright orange)
- Background: `#182635` (dark blue-gray)
- Success: `#4CAF50` (green)
- Warning: `#FF9800` (amber)
- Error: `#F44336` (red)

**Typography**:
- Primary font: System default
- Sizes: 13px-28px range
- Weights: normal, bold

**Layout**:
- Border radius: 8px-16px for cards
- Shadows: Layered box-shadows for depth
- Transitions: 0.2s-0.3s ease for smooth interactions

## Performance Optimizations

### Implemented Optimizations

1. **Conditional Rendering**: Components render only when needed
2. **Event Debouncing**: Auto-refresh intervals optimized
3. **Lazy Loading**: File processing handled asynchronously
4. **Memory Management**: Cleanup in file upload components
5. **Streaming**: Real-time LLM responses reduce perceived latency

### Future Optimization Opportunities

1. **React.memo**: Memoize components to prevent unnecessary re-renders
2. **useMemo/useCallback**: Optimize expensive calculations and callbacks
3. **Virtual Scrolling**: For large PDF lists
4. **Code Splitting**: Lazy load components
5. **Service Workers**: Cache API responses

## Error Handling

### Error Boundaries

Currently using component-level error handling. Consider implementing React Error Boundaries for better error isolation.

### Error Display Patterns

- **Inline Errors**: Form validation and API errors
- **Toast/Banner**: System-level notifications
- **Fallback UI**: Graceful degradation when components fail

### Network Error Handling

- Retry mechanisms for failed requests
- Offline state detection
- Timeout handling for long-running operations

## Testing Strategy

### Current State

No automated tests are currently implemented.

### Recommended Testing Approach

#### Unit Tests (Jest + React Testing Library)

```javascript
// Example test structure
describe('UploadCard', () => {
  test('accepts PDF files', () => {
    // Test file validation
  });
  
  test('rejects non-PDF files', () => {
    // Test error handling
  });
  
  test('handles upload success', () => {
    // Test success callback
  });
});
```

#### Integration Tests

- Component interaction testing
- API integration testing
- End-to-end user flows

#### Performance Tests

- Animation performance
- Large file handling
- Memory leak detection

### Testing Priorities

1. **Critical Paths**: Upload, chat, document listing
2. **Error Scenarios**: Network failures, invalid inputs
3. **Edge Cases**: Large files, long responses, empty states
4. **Browser Compatibility**: Cross-browser testing
5. **Mobile Responsiveness**: Touch interactions

## Development Guidelines

### Component Creation Checklist

- [ ] Single responsibility principle
- [ ] PropTypes or TypeScript definitions
- [ ] Error boundary consideration
- [ ] Performance optimization review
- [ ] Accessibility features (ARIA labels, keyboard navigation)
- [ ] Mobile responsiveness
- [ ] Testing strategy

### Code Style Guidelines

- Use functional components with hooks
- Prefer composition over inheritance
- Keep components under 200 lines when possible
- Use descriptive variable and function names
- Comment complex logic and business rules
- Follow consistent indentation and formatting

### Performance Guidelines

- Minimize inline object creation in render methods
- Use keys properly in lists
- Avoid deep nesting of conditional renders
- Consider component memoization for expensive renders
- Profile components with React DevTools

---

This documentation should be updated as components evolve and new features are added. For specific implementation details, refer to the component source code and inline comments.
