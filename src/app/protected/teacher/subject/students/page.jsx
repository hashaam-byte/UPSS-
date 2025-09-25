// app/protected/teacher/subject/students/page.jsx
'use client';

import { useState, useEffect } from 'react';

import { 
  Users, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  AlertTriangle,
  Award,
  Clock,
  FileText,
  Mail,
  Phone
} from 'lucide-react';

export default function SubjectTeacherStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, selectedClass]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentProfile?.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => 
        student.studentProfile?.className === selectedClass
      );
    }

    setFilteredStudents(filtered);
  };

  const getPerformanceColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score) => {
    if (score >= 75) return { variant: 'default', text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { variant: 'secondary', text: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    return { variant: 'destructive', text: 'Needs Help', color: 'bg-red-100 text-red-800' };
  };

  const handleSendMessage = async (studentId) => {
    // Handle sending message to student
    console.log('Send message to student:', studentId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Students</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-muted-foreground">
            Manage and track your subject students' performance
          </p>
        </div>
        <Badge variant="outline">
          <Users className="w-4 h-4 mr-2" />
          {filteredStudents.length} Students
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Classes</option>
          {classes.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      {/* Students Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="top">Top Performers</TabsTrigger>
          <TabsTrigger value="attention">Need Attention</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {filteredStudents.map((student) => {
              const performance = student.performance || { averageScore: 0, completionRate: 0, trend: 'stable' };
              const badge = getPerformanceBadge(performance.averageScore);
              
              return (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {student.studentProfile?.studentId} • {student.studentProfile?.className}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${getPerformanceColor(performance.averageScore)}`}>
                              {performance.averageScore}%
                            </span>
                            {performance.trend === 'improving' && (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            )}
                            {performance.trend === 'declining' && (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <Badge className={badge.color}>
                            {badge.text}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedStudent(student)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {student.firstName} {student.lastName}
                                </DialogTitle>
                                <DialogDescription>
                                  Student Performance Details
                                </DialogDescription>
                              </DialogHeader>
                              <StudentDetailView student={student} />
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendMessage(student.id)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {performance.completionRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Completion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {performance.assignmentsSubmitted || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Assignments Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {performance.attendanceRate || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Attendance</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <div className="grid gap-4">
            {filteredStudents
              .filter(student => (student.performance?.averageScore || 0) >= 75)
              .map((student, index) => (
                <Card key={student.id} className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge variant="default" className="bg-green-600">
                          #{index + 1}
                        </Badge>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {student.firstName} {student.lastName}
                            <Award className="w-4 h-4 text-yellow-500" />
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {student.studentProfile?.className}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {student.performance?.averageScore || 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="attention" className="space-y-4">
          <div className="grid gap-4">
            {filteredStudents
              .filter(student => (student.performance?.averageScore || 0) < 60)
              .map((student) => (
                <Card key={student.id} className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {student.studentProfile?.className}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {(student.performance?.missedAssignments || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {student.performance.missedAssignments} missed
                              </Badge>
                            )}
                            {(student.performance?.lateSubmissions || 0) > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {student.performance.lateSubmissions} late
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          {student.performance?.averageScore || 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">Needs Support</p>
                        <Button size="sm" className="mt-2" variant="outline">
                          Create Alert
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Student Detail Component
function StudentDetailView({ student }) {
  const performance = student.performance || {};
  
  return (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <Avatar className="w-16 h-16">
          <AvatarImage src={student.avatar} />
          <AvatarFallback>
            {student.firstName[0]}{student.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-semibold">
            {student.firstName} {student.lastName}
          </h3>
          <p className="text-muted-foreground">
            {student.studentProfile?.studentId} • {student.studentProfile?.className}
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">
              <Mail className="w-3 h-3 mr-1" />
              {student.email}
            </Badge>
            {student.studentProfile?.parentPhone && (
              <Badge variant="outline">
                <Phone className="w-3 h-3 mr-1" />
                {student.studentProfile.parentPhone}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {performance.averageScore || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {performance.completionRate || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {performance.assignmentsSubmitted || 0}
              </div>
              <p className="text-sm text-muted-foreground">Assignments Submitted</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {performance.missedAssignments || 0}
              </div>
              <p className="text-sm text-muted-foreground">Missed Assignments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(student.recentActivity || []).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{activity.score}%</p>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="flex-1">
          <MessageCircle className="w-4 h-4 mr-2" />
          Send Message
        </Button>
        <Button variant="outline" className="flex-1">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Create Alert
        </Button>
      </div>
    </div>
  );
}