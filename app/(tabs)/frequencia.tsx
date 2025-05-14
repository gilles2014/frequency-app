
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';

  export default function Frequencia() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    // Mock data for students (will be replaced with data from Google Sheets/Firebase)
    const [students, setStudents] = useState([
      { id: '1', name: 'Aluno A', presence: 'P' },
      { id: '2', name: 'Aluno B', presence: 'P' },
      { id: '3', name: 'Aluno C', presence: 'P' },
      // Add more mock students here
    ]);

    const grades = ['6º', '7º', '8º', '9º'];
    const classes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const presenceOptions = ['P', 'F', 'FJ'];

    const onDateChange = (date: Date) => {
      setSelectedDate(date);
    };

    const handlePresenceChange = (studentId: string, value: string) => {
      setStudents(students.map(student =>
        student.id === studentId ? { ...student, presence: value } : student
      ));
    };

    
    return (
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>Registro de Presença</Text>

          <Text style={styles.label}>Selecione a Data:</Text>
          <CalendarPicker onDateChange={onDateChange} />

          <Text style={styles.label}>Selecione a Série:</Text>
          <Picker
            selectedValue={selectedGrade}
            onValueChange={(itemValue) => setSelectedGrade(itemValue)}
          >
            <Picker.Item label="Selecione a Série" value={null} />
            {grades.map((grade) => (
              <Picker.Item key={grade} label={grade} value={grade} />
            ))}
          </Picker>

          <Text style={styles.label}>Selecione a Turma:</Text>
          <Picker
            selectedValue={selectedClass}
            onValueChange={(itemValue) => setSelectedClass(itemValue)}
          >
            <Picker.Item label="Selecione a Turma" value={null} />
            {classes.map((cla) => (
              <Picker.Item key={cla} label={cla} value={cla} />
            ))}
          </Picker>

          {selectedDate && selectedGrade && selectedClass && (
            <View style={styles.studentsList}>
              <Text style={styles.label}>Alunos:</Text>
              {students.map((student) => (
                <View key={student.id} style={styles.studentRow}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Picker
                    selectedValue={student.presence}
                    style={styles.presencePicker}
                    onValueChange={(itemValue) => handlePresenceChange(student.id, itemValue)}
                  >
                    {presenceOptions.map((option) => (
                      <Picker.Item key={option} label={option} value={option} />
                    ))}
                  </Picker>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    label: {
      fontSize: 18,
      marginTop: 10,
      marginBottom: 5,
    },
    studentsList: {
      marginTop: 20,
      borderTopWidth: 1,
      borderColor: '#ccc',
      paddingTop: 10,
    },
    studentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    studentName: {
      fontSize: 16,
      flex: 1,
    },
    presencePicker: {
      width: 80,
    },
  });