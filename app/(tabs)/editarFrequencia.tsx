import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';

export default function EditarRegistro() {
  const route = useRoute();
  const navigation = useNavigation();
  const { registro } = route.params as any;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Ano: {registro.ano}</Text>
      <Text>Turma: {registro.turma}</Text>

      {/* Campos editáveis */}
      <TextInput placeholder="Total Presentes" value={String(registro.totalPresentes)} />
      <TextInput placeholder="Total Faltas" value={String(registro.totalFaltas)} />

      {/* Botão para salvar depois */}
      <Button title="Salvar" onPress={() => { /* lógica de salvar */ }} />
    </View>
  );
}
